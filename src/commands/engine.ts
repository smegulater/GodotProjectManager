import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import AdmZip from "adm-zip";
import inquirer, { type Answers } from "inquirer";

import { downloadFile } from "../utils/download.js";

//import { fileURLToPath } from "url";
//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

export function getEngineDir() {
  const home = process.env.HOME || process.env.USERPROFILE;
  const dir = path.join(home!, ".gpm", "engines");
  fs.ensureDirSync(dir);
  return dir;
}

async function checkForExistingInstallation(
  enginesPath: string,
  version: string,
  mono: boolean
) {
  const extractDir = path.join(enginesPath, `${version}${mono ? "-mono" : ""}`);
  let exists: boolean = false;
  if (await fs.pathExists(extractDir)) {
    exists = true;
    console.log(
      chalk.green(
        `Godot ${version}${mono ? " (Mono)" : ""} installation already exists.`
      )
    );
  }

  return exists;
}

export async function installEngine(
  version?: string,
  flavor: "stable" | "rc" | "beta" = "stable",
  mono?: boolean
) {
  const projectDir = process.cwd();
  const enginesPath = getEngineDir();

// 🧩 Try to auto-detect version & mono if not provided
  if (!version) {
    const gpmrcPath = path.join(projectDir, ".gpmrc");
    const gpmJsonPath = path.join(projectDir, "gpm.json");

    if (fs.existsSync(gpmrcPath)) {
      const gpmrc = await fs.readJson(gpmrcPath);
      version = gpmrc.engineVersion;
      mono = gpmrc.mono ?? mono;
    } else if (fs.existsSync(gpmJsonPath)) {
      const gpmConfig = await fs.readJson(gpmJsonPath);
      version = gpmConfig.engine;
      mono = gpmConfig.language === "mono";
    } else {
      console.log(chalk.red("❌ No version specified and no project config found."));
      console.log(chalk.gray("Run inside a GPM project folder or provide a version manually."));
      return;
    }
  }
if (!version) {
    console.log(chalk.red("❌ Unable to determine engine version."));
    return;
  }

  // ✅ Default mono flag to false if still undefined
  mono = mono ?? false;

  if (await checkForExistingInstallation(enginesPath, version, mono)) return;

  const spinner = ora(`Installing Godot ${version} (${flavor})...`).start();
  try {
    const extractDir = path.join(
      enginesPath,
      `${version}${mono ? "-mono" : ""}`
    );

    // Otherwise, continue with download
    let slug = "";
    let platformParam = "";
    let fileName = "";

    const platform = process.platform;
    if (platform === "win32") {
      slug = mono ? "mono_win64.zip" : "win64.exe.zip";
      platformParam = "windows.64";
      fileName = mono
        ? `Godot_v${version}_${flavor}_mono_win64.zip`
        : `Godot_v${version}_${flavor}_win64.zip`;
    } else if (platform === "darwin") {
      slug = mono ? "mono_macos.universal.zip" : "macos.universal.zip";
      platformParam = "macos.universal";
      fileName = mono
        ? `Godot_v${version}_${flavor}_mono_macos.universal.zip`
        : `Godot_v${version}_${flavor}_macos.universal.zip`;
    } else {
      slug = mono ? "mono_linux_x86_64.zip" : "linux.x86_64.zip";
      platformParam = "linux.64";
      fileName = mono
        ? `Godot_v${version}_${flavor}_mono_linux_x86_64.zip`
        : `Godot_v${version}_${flavor}_linux.x86_64.zip`;
    }

    const url = `https://downloads.godotengine.org/?version=${version}&flavor=${flavor}&slug=${slug}&platform=${platformParam}`;
    const destZip = path.join(enginesPath, fileName);

    spinner.text = chalk.cyan(`⬇ Downloading Godot ${version} (${flavor})...`);

    await downloadFile(url, destZip);

    spinner.text = "Extracting engine...";
    await fs.ensureDir(extractDir);

    const zip = new AdmZip(destZip);
    zip.extractAllTo(extractDir, true);
    await fs.remove(destZip);

    spinner.succeed(
      chalk.green(
        `Godot ${version}${mono ? " (Mono)" : ""} installed successfully!`
      )
    );
    console.log(chalk.gray(`→ Installed at: ${extractDir}`));
  } catch (err: any) {
    spinner.fail(
      chalk.red(`Failed to install Godot ${version}: ${err.message}`)
    );
  }
}

export async function uninstallEngine() {
  const enginesPath = getEngineDir();

  const installedEngines = await listEngines(true);
  if (installedEngines.length === 0) {
    console.log(`No Engines installed. Exiting.`);
    return;
  }

  const answers: Answers = await inquirer.prompt([
    {
      type: "list",
      name: "version",
      message: "Engine version to uninstall:",
      choices: installedEngines
    },
  ]);

  const spinner = ora(`Uninstalling Godot ${answers.version} ...`).start();

  try {
    await fs.removeSync(path.join(enginesPath, answers.version));
    spinner.succeed(`Uninstalled ${answers.version} successfully`);
  } catch (error: any) {
    spinner.fail(`Failed to uninstall ${answers.version} due to: ${error}`);
  }
}

export async function listEngines(hideOutput: boolean = false) {
  const enginesPath = getEngineDir();
  const dirs: Array<string> = await fs.readdir(enginesPath);

  if (!hideOutput) {
    console.log(chalk.cyan("Installed Godot engines:"));
    for (const dir of dirs) console.log(` - ${dir}`);
  }
  return dirs;
}
