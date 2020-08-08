import generateAssets from "./generateAssets";
import uploadAssets from "./uploadAssets";

const [task, ...args] = process.argv.slice(2);

async function run() {
  try {
    switch (task) {
      case "generate":
        await generateAssets(args[0], args[1]);
        break;
      case "upload":
        await uploadAssets(args[0]);
        break;
      default:
        throw new Error(`Unsupported task: ${task}`);
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

run();
