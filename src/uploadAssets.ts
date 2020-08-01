import axios from "axios";
import { map } from "bluebird";
import * as FormData from "form-data";
import { createReadStream, readdirSync } from "fs";
import { join } from "path";

async function uploadAssets(outputPath: string) {
  const { data } = await axios.post(
    "http://pagediff-env-1.eba-dzmczmau.us-east-2.elasticbeanstalk.com/api/screenshots"
  );
  console.log("Got data", data);

  const files = readdirSync(outputPath);

  await map(
    files,
    async (file) => {
      const { url, fields, prefix } = data;
      const form = new FormData();
      Object.keys(fields).forEach((key) => {
        form.append(key, fields[key]);
      });
      const sourceFile = join(outputPath, file);
      console.log(`Uploading file ${sourceFile}`);
      form.append("key", `${prefix}${file}`);
      form.append("file", createReadStream(sourceFile));

      await axios.post(url, form);
    },
    { concurrency: 5 }
  );
}

export default uploadAssets;
