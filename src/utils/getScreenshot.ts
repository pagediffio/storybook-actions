import { Page, CDPSession } from "puppeteer";
import { IStory } from "../types";

export default async function getScreenshot(page: Page, story: IStory) {
  await page.evaluate(
    () =>
      new Promise((res) =>
        (window as any).requestIdleCallback(() => res(), { timeout: 3000 })
      )
  );

  const client: CDPSession = (page as any)._client as CDPSession;
  const height = Math.ceil(
    await page.evaluate(() => document.documentElement.offsetHeight)
  );

  const currentViewport = page.viewport();
  const { isMobile = false, deviceScaleFactor = 1, isLandscape = false } =
    currentViewport || {};

  const screenOrientation = isLandscape
    ? { angle: 90, type: "landscapePrimary" }
    : { angle: 0, type: "portraitPrimary" };

  await client.send("Emulation.setDeviceMetricsOverride", {
    mobile: isMobile,
    width: currentViewport.width,
    height,
    deviceScaleFactor,
    screenOrientation,
  });

  const buffer = await page.screenshot();
  await page.setViewport(currentViewport);
  return buffer;
}
