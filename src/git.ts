import { exec } from "@actions/exec";

async function execAndGetOutput(command, args) {
  let output = "";

  await exec(command, args, {
    silent: true,
    listeners: {
      stdout(data: Buffer) {
        output += data.toString();
      },
    },
  });

  return output.trim();
}

export async function getMergeBase(
  baseBranch: string,
  currentBranch: string,
  currentCommit: string
) {
  let branchRevs = "";
  let baseRevs = "";

  const commit = await execAndGetOutput("git", [
    "merge-base",
    baseBranch,
    currentBranch,
  ]);
  try {
    branchRevs = await execAndGetOutput("git", [
      "log",
      "--format=%H",
      "-n",
      "20",
      `${commit}...${currentBranch}`,
      "--",
    ]);
  } catch (err) {}

  try {
    baseRevs = await execAndGetOutput("git", [
      "log",
      "--format=%H",
      "--first-parent",
      "-n",
      "20",
      `${commit}`,
      "--",
    ]);
    console.log("==commit", baseRevs);
  } catch (err) {}

  const historicalCommit = (commit: string) => commit !== currentCommit;
  const branch = branchRevs.split(/\r?\n/).filter(historicalCommit);
  const base = baseRevs.split(/\r?\n/).filter(historicalCommit);

  return {
    branch,
    base,
  };
}
