import generateAssets from "./generateAssets";
import uploadAssets from "./uploadAssets";

async function run() {
  try {
    await generateAssets(process.argv[2], process.argv[3]);
    await uploadAssets(process.argv[3]);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

run();
