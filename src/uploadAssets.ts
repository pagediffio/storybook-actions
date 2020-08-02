import { map } from "bluebird";
import * as FormData from "form-data";
import got from "got";
import { createReadStream, readdirSync } from "fs";
import { join } from "path";

async function uploadAssets(outputPath: string) {
  const {
    body,
  } = await got
    .post(
      "http://pagediff-env-1.eba-dzmczmau.us-east-2.elasticbeanstalk.com/api/screenshots",
      {
        json: {
          accessToken: process.env.INPUT_TOKEN,
          commit: process.env.GITHUB_SHA,
        },
      }
    )
    .json();

  console.log("Got data", body);

  const files = readdirSync(outputPath);

  await map(
    files,
    async (file) => {
      const { url, fields, prefix } = body;
      const form = new FormData();
      Object.keys(fields).forEach((key) => {
        form.append(key, fields[key]);
      });
      const sourceFile = join(outputPath, file);
      console.log(`Uploading file ${sourceFile}`);
      form.append("key", `${prefix}${file}`);
      form.append("file", createReadStream(sourceFile));

      await got.post(url, { body: form });
    },
    { concurrency: 5 }
  );
}

export default uploadAssets;
