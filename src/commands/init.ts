import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { installEngine } from "./engine.js";
import { useEngine } from "./use.js";

export async function initProject() {
  console.clear();
  console.log(chalk.cyan("\n✨ GPM Project Initializer ✨"));
  console.log(chalk.gray("Setting up GPM for an existing Godot project...\n"));

  const cwd = process.cwd();
  const godotFile = path.join(cwd, "project.godot");
  
  if(! await serveWarning()) return;
  
  // Step 1: detect Godot project
  if (!(await fs.pathExists(godotFile))) {
    console.log(chalk.red("No 'project.godot' found in this directory."));
    console.log(chalk.gray("Please run this inside an existing Godot project."));
    return;
  }

  // Step 2: ask for project details
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Project name:",
      default: path.basename(cwd),
    },
    {
      type: "input",
      name: "description",
      message: "Description:",
      default: "An existing Godot project",
    },
    {
      type: "list",
      name: "template",
      message: "Project template:",
      choices: ["2D", "3D"],
      default: "3D",
    },
    {
      type: "list",
      name: "language",
      message: "Programming language:",
      choices: ["GDScript", "C# (Mono)"],
      default: "GDScript",
    },
    {
      type: "input",
      name: "engine",
      message: "Godot version:",
      default: "4.5.1",
    },
    {
      type: "confirm",
      name: "autoInstall",
      message: "Install engine if missing?",
      default: true,
    },
    {
      type: "confirm",
      name: "gitInit",
      message: "Initialize Git repository?",
      default: false,
    },
  ]);

  // Step 3: Create gpm.json
  const gpmConfig = {
    name: answers.name,
    description: answers.description,
    engine: answers.engine,
    template: answers.template.toLowerCase(),
    language: answers.language.includes("C#") ? "mono" : "gdscript",
    author: process.env.USER || process.env.USERNAME || "Unknown",
    createdAt: new Date().toISOString(),
    version: "0.1.0",
  };

  await fs.writeJson(path.join(cwd, "gpm.json"), gpmConfig, { spaces: 2 });

  // Step 4: Create .gpmrc
  const gpmrc = {
    engineVersion: answers.engine,
    mono: answers.language.includes("C#"),
  };
  await fs.writeJson(path.join(cwd, ".gpmrc"), gpmrc, { spaces: 2 });

  console.log(chalk.green("✅ Configuration files created."));

  // Step 5: Install & link engine
  if (answers.autoInstall) {
    await installEngine({mono: gpmrc.mono, isNew: false, installVersion:answers.engine});
  }

  await useEngine(answers.engine);
  console.log(chalk.green(`✔ Engine ${answers.engine} linked to project.`));

  // Step 6: Optional Git setup
  if (answers.gitInit) {
    try {
      const { execa } = await import("execa");
      await execa("git", ["init"], { cwd });
      await execa("git", ["add", "."], { cwd });
      await execa("git", ["commit", "-m", "Initialize GPM project"], { cwd });
      console.log(chalk.green("✅ Initialized Git repository"));
    } catch {
      console.log(chalk.yellow("⚠️  Git not available, skipping repo setup."));
    }
  }

  console.log(chalk.green("\n🎉 GPM successfully initialized!"));
  console.log(chalk.gray(`Project: ${answers.name}`));
  console.log(chalk.gray(`Location: ${cwd}`));
  console.log(chalk.green("\nNext steps:"));
  console.log("  gpm run");
  console.log("  gpm run test\n");
}


async function serveWarning() {
console.log(chalk.yellow.bold('\n⚠️  WARNING:'));
console.log(chalk.yellow('Before continuing, please make sure you:'));
console.log(chalk.yellow(' - Have created a backup of your project.'));
console.log(chalk.yellow(' - Have closed Godot completely.\n'));

const { confirmContinue } = await inquirer.prompt([
  {
    type: 'confirm',
    name: 'confirmContinue',
    message: 'Do you want to continue?',
    default: false,
  },
]);

return confirmContinue;
}