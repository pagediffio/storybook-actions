import * as FormData from "form-data";
import { createReadStream } from "fs";
import got from "got";

async function uploadAssets(file: string) {
  const { body } = await got.post(
    "http://pagediff-env-1.eba-dzmczmau.us-east-2.elasticbeanstalk.com/api/artifacts",
    {
      json: {
        accessToken: process.env.INPUT_TOKEN,
        commit: process.env.GITHUB_SHA,
      },
    }
  );

  console.log("Got data", body);

  const { url, fields } = JSON.parse(body);
  const form = new FormData();
  Object.keys(fields).forEach((key) => {
    form.append(key, fields[key]);
  });
  form.append("file", createReadStream(file));

  await got.post(url, { body: form });
}

export default uploadAssets;
