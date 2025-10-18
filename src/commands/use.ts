import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import {getEngineDir} from './engine.js'


export async function useEngine(versionArg?: string) {
  const cwd = process.cwd();
  const enginesDir = getEngineDir();

  if (!fs.existsSync(enginesDir)) {
    console.log(chalk.red("❌ No engines installed yet. Run `gpm engine install <version>` first."));
    return;
  }

  const installedEngines = await fs.readdir(enginesDir);

  if (installedEngines.length === 0) {
    console.log(chalk.red("❌ No engines available."));
    return;
  }

  let chosenVersion = versionArg;

  if (!chosenVersion) {
    const answer = await inquirer.prompt([
      {
        type: "list",
        name: "engine",
        message: "Select an engine version to use:",
        choices: installedEngines
      }
    ]);
    chosenVersion = answer.engine;
  } else if (!installedEngines.includes(chosenVersion)) {
    console.log(chalk.red(`❌ Engine ${chosenVersion} not found in ~/.gpm/engines`));
    return;
  }

  // Write .gpmrc
  const rcPath = path.join(cwd, ".gpmrc");
  const data = { engine: chosenVersion };
  await fs.writeJson(rcPath, data, { spaces: 2 });

  console.log(chalk.green(`Engine set to ${chosenVersion} for this project`));
}
