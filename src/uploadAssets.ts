import * as FormData from "form-data";
import got from "got";
import { createReadStream } from "fs";

async function uploadAssets(file: string) {
  const { body } = await got
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

  const { url, fields, key } = body;
  const form = new FormData();
  Object.keys(fields).forEach((key) => {
    form.append(key, fields[key]);
  });
  form.append("key", key);
  form.append("file", createReadStream(file));

  await got.post(url, { body: form });
}

export default uploadAssets;
