import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { execa } from "execa";
import inquirer, { type Answers } from "inquirer";
import {listEngines} from "./engine.js";
/**
 * Runs the current Godot project using the selected engine.
 * Priority:
 *   1. .gpmrc (local engine override)
 *   2. gpm.json (project metadata)
 *   3. error if neither exists
 */
export async function runProject(mode: "default" | "test" = "default") {
  const cwd = process.cwd();
  const configPath = path.join(cwd, "gpm.json");
  const rcPath = path.join(cwd, ".gpmrc");

  let engineVersion: string | undefined;

  // Try to read local override first (.gpmrc)
  if (fs.existsSync(rcPath)) {
    try {
      const rc = await fs.readJson(rcPath);
      engineVersion = rc.engine;
    } catch {
      console.log(chalk.red("⚠️  Failed to read .gpmrc file."));
    }
  }

  // Fallback: gpm.json
  if (!engineVersion && fs.existsSync(configPath)) {
    try {
      const config = await fs.readJson(configPath);
      engineVersion = config.engine;
    } catch {
      console.log(chalk.red("⚠️  Failed to read gpm.json file."));
    }
  }

  if (!engineVersion) {
    console.log(chalk.red("❌ No engine version found (.gpmrc or gpm.json)."));
    console.log(
      chalk.gray("Run `gpm use` or `gpm init` to configure a version.")
    );
    return;
  }

  const home = process.env.HOME || process.env.USERPROFILE;
  const enginesRoot = path.join(home!, ".gpm", "engines");

  if (!fs.existsSync(enginesRoot)) {
    console.log(chalk.red("❌ No engines installed yet."));
    console.log(
      chalk.gray("Use `gpm engine install <version>` to install one.")
    );
    return;
  }

  // Find engine folder matching version (supports mono suffix)
  const availableEngines = await fs.readdir(enginesRoot);
  const match = availableEngines.find((d) => d.includes(engineVersion));

  if (!match) {
    console.log(
      chalk.red(`❌ Engine ${engineVersion} not found in ~/.gpm/engines`)
    );
    console.log(chalk.gray(`Run: gpm engine install ${engineVersion}`));
    return;
  }

  const enginePath = path.join(enginesRoot, match);
  const exePath = await findEngineExecutable(enginePath);

  if (!exePath) {
    console.log(
      chalk.red(
        "❌ Could not find a valid Godot executable in this engine folder."
      )
    );
    console.log(chalk.gray(`Checked: ${enginePath}`));
    return;
  }

  const projectDir = path.join(cwd, "project");

  if (!fs.existsSync(projectDir)) {
    console.log(chalk.red("❌ No 'project' folder found in this directory."));
    console.log(chalk.gray("Make sure you are inside a GPM project."));
    return;
  }

  try {
    if (mode === "test") {
      console.log(chalk.cyan(`🧪 Running tests in Godot ${engineVersion}...`));
      await execa(
        exePath,
        ["--headless", "--run-tests", "--path", projectDir],
        {
          detached: true, // detach from parent
          stdio: "ignore", // ignore I/O so Node can exit
          windowsHide: true, // prevent new console window on Windows
        }
      );
    } else {
      console.log(chalk.cyan(`🚀 Launching Godot ${engineVersion}...`));
      const subprocess = execa(exePath, ["-e", "--path", projectDir], {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      });

      subprocess.unref();
      console.log(chalk.green("🚀 Godot editor launched!"));
    }
  } catch (err: any) {
    console.log(chalk.red(`❌ Failed to run Godot: ${err.message}`));
  }
}

export async function runEditor() {


  let engineVersion: string | undefined;

  const home = process.env.HOME || process.env.USERPROFILE;
  const enginesRoot = path.join(home!, ".gpm", "engines");

  if (!fs.existsSync(enginesRoot)) {
    console.log(chalk.red("No engines installed yet."));
    console.log(
      chalk.gray("Use `gpm engine install <version>` to install one.")
    );
    return;
  }

  // Find engine folder matching version (supports mono suffix)
  const installedEngines = await listEngines(true);

  const answers: Answers = await inquirer.prompt([
    {
      type: "list",
      name: "version",
      message: "Engine version to launch:",
      choices: installedEngines,
    },
  ]);

  const enginePath = path.join(enginesRoot, answers.version);
  const exePath = await findEngineExecutable(enginePath);

  if (!exePath) {
    console.log(
      chalk.red(
        "❌ Could not find a valid Godot executable in this engine folder."
      )
    );
    console.log(chalk.gray(`Checked: ${enginePath}`));
    return;
  }

  try {
    console.log(chalk.cyan(`⌛ Launching Godot ${engineVersion}...`));
    const subprocess = execa(exePath,[], {
      detached: true,
      stdio: "ignore",
      windowsHide: false,
    });

    subprocess.unref();
    console.log(chalk.green("🚀 Godot editor launched!"));
  } catch (err: any) {
    console.log(chalk.red(`❌ Failed to run Godot: ${err.message}`));
  }
}
/**
 * Finds the correct executable file inside an engine directory.
 * Works for:
 *   - Windows (.exe)
 *   - macOS (.app/Contents/MacOS/Godot)
 *   - Linux (binary file named 'Godot' or similar)
 */
async function findEngineExecutable(
  engineFolder: string
): Promise<string | null> {
  const files = await fs.readdir(engineFolder, { withFileTypes: true });


  const exeFile = files.find(
    (f) => f.isFile() && f.name.toLowerCase().endsWith(".exe")
  );
  if (exeFile) return path.join(engineFolder, exeFile.name);

  // 2️⃣ Check for macOS .app bundle
  const appFolder = files.find(
    (f) => f.isDirectory() && f.name.endsWith(".app")
  );
  if (appFolder) {
    const godotPath = path.join(
      engineFolder,
      appFolder.name,
      "Contents",
      "MacOS"
    );
    if (fs.existsSync(godotPath)) {
      const innerFiles = await fs.readdir(godotPath);
      const godotBinary = innerFiles.find((f) =>
        f.toLowerCase().includes("godot")
      );
      if (godotBinary) return path.join(godotPath, godotBinary);
    }
  }

  // 3️⃣ Check for Linux or generic binary
  const godotBinary = files.find(
    (f) =>
      f.isFile() &&
      f.name.toLowerCase().includes("godot") &&
      !f.name.endsWith(".zip")
  );
  if (godotBinary) return path.join(engineFolder, godotBinary.name);

  // 4️⃣ Last resort: recurse one level deeper (some zips create an inner folder)
  const innerDir = files.find((f) => f.isDirectory());
  if (innerDir) {
    return await findEngineExecutable(path.join(engineFolder, innerDir.name));
  }

  return null;
}
