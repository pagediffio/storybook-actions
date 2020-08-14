import { writeFileSync } from "fs";
import got from "got";
import { join } from "path";
import { v4 } from "uuid";
import { getMergeBase } from "./git";
import { IStoryVariant } from "./types";
import { createExecutionService } from "./utils/asyncUtils";
import Debug from "./utils/Debug";
import getScreenshot from "./utils/getScreenshot";
import getStories from "./utils/getStories";
import getVariants from "./utils/getVariants";
import setCurrentStory from "./utils/setCurrentStory";
import setViewport, { DEFAULT_VIEWPORT } from "./utils/setViewport";
import StaticServer from "./utils/StaticServer";
import StoryBrowser from "./utils/StoryBrowser";

const keyForVariant = (variant: IStoryVariant) =>
  `${variant.story.id}|${variant.name}`;

const debug = Debug("generateAssets");

const POOL_SIZE = 3;

export default async function generateAssets(
  builtPath: string,
  outputPath: string
) {
  const server = new StaticServer(builtPath);
  const address = await server.start();
  const stories = await getStories(address);

  const variants = stories.flatMap(getVariants);

  const workers = await Promise.all(
    new Array(POOL_SIZE).fill(0).map((i) => new StoryBrowser(address).init())
  );

  const data = await runTasks(workers, variants, outputPath);
  const pages = variants.map((variant) => {
    const key = keyForVariant(variant);
    const { html, screenshot, viewport } = data[key];
    return {
      key,
      componentKey: `${variant.story.kind}/${variant.story.name}`,
      html,
      viewport,
      screenshot,
      story: { ...variant.story, version: "5" },
    };
  });

  const metadata = {
    repo: process.env.GITHUB_REPOSITORY,
    commit: process.env.GITHUB_SHA,
    message: process.env.COMMIT_MSG,
    ref: process.env.GITHUB_REF,
    actor: process.env.GITHUB_ACTOR,
    pages,
  };

  writeFileSync(join(outputPath, "metadata.json"), JSON.stringify(metadata));

  const branch = process.env.GITHUB_REF?.slice(11);
  if (!branch) {
    throw new Error("Cannot get branch name");
  }
  const {
    body,
  } = await got.post(
    "http://pagediff-env-1.eba-dzmczmau.us-east-2.elasticbeanstalk.com/api/settings",
    { json: { accessToken: process.env.INPUT_TOKEN } }
  );

  const { branch: base } = JSON.parse(body);
  const commits = JSON.stringify(
    await getMergeBase(base, branch, process.env.GITHUB_SHA || "")
  );
  console.log("Commits", commits);
  writeFileSync(join(outputPath, "commits.json"), commits);

  await Promise.all(workers.map((worker) => worker.destroy()));
  server.close();
}

async function runTasks(
  workers: StoryBrowser[],
  variants: IStoryVariant[],
  outputPath: string,
  maxRetries = 3
) {
  const data: {
    [key: string]: { html: string; viewport: number; screenshot: string };
  } = {};

  const tasks = variants.map((variant) => ({ retries: 0, variant }));
  const service = createExecutionService(
    workers,
    tasks,
    ({ retries, variant }, { push }) => async (worker) => {
      try {
        const { page } = worker;
        if (!page) {
          throw new Error("Page is not present.");
        }

        const viewport = variant.options.viewport || DEFAULT_VIEWPORT;
        await setViewport(page, viewport);

        worker.resourceWatcher?.clear();
        await setCurrentStory(page, variant.story);
        debug(
          "Wait for requested resources resolved",
          worker.resourceWatcher?.getRequestedUrls()
        );
        await worker.waitBrowserMetricsStable("preEmit");
        await worker.resourceWatcher?.waitForRequestsComplete();

        await worker.waitBrowserMetricsStable("postEmit");
        const html = await worker.page!.content();

        const buffer = await getScreenshot(page, variant.story);
        const filename = `${v4()}-${Date.now()}.png`;
        const targetPath = join(outputPath, filename);
        writeFileSync(targetPath, buffer);
        data[keyForVariant(variant)] = { html, viewport, screenshot: filename };
        console.log(`Captured ${filename}`);
      } catch (err) {
        console.error(
          `Failed to capture story ${variant.story.id}(${variant.name}): ${err.message}`
        );
        if (retries < maxRetries) {
          push({ retries: retries + 1, variant });
        } else {
          throw err;
        }
      }
    }
  );

  try {
    await service.execute();
  } finally {
    service.close();
  }

  return data;
}
