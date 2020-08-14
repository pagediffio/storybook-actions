import generateAssets from "./generateAssets";
import uploadAssets from "./uploadAssets";

const [task, ...args] = process.argv.slice(2);

async function run() {
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
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
