import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

//import { fileURLToPath } from "url";
//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

export async function initProject() {
  console.log(chalk.cyan("\n🚀 Welcome to Godot Project Manager (GPM)"));
  console.log(chalk.gray("Let's set up your new Godot project.\n"));

  // Ask user for basic info
  const answers = await inquirer.prompt([
      {
      type: "input",
      name: "name",
      message: "Project name:",
      default: "my-godot-project",
      validate: (input: string) => !!input.trim() || "Project name cannot be empty."
    },
    {
      type: "input",
      name: "engine",
      message: "Godot version:",
      default: "4.3"
    },
    {
      type: "list",
      name: "template",
      message: "Project template:",
      choices: ["2D", "3D"],
      default: "2D"
    },
    {
      type: "input",
      name: "description",
      message: "Project description:",
      default: "A new Godot project"
    }
  ]);

  const projectDir = path.resolve(process.cwd(), answers.name);
  const projectPath = path.join(projectDir, "project");

  if (fs.existsSync(projectDir)) {
    const overwriteAnswer = await inquirer.prompt([
      {
        name: "overwrite",
        type: "confirm",
        message: `Directory "${answers.name}" already exists. Overwrite?`,
        default: false
      }
    ]);
    if (!overwriteAnswer.overwrite) {
      console.log(chalk.red("✖ Aborted."));
      return;
    }
    await fs.remove(projectDir);
  }

  console.log(chalk.cyan("📁 Creating project folder structure..."));

  // Folder structure
  const structure = [
    "engine",
    "project/src",
    "project/scenes",
    "project/assets",
    "project/tests",
    "project/addons",
    "build",
    "scripts"
  ];

  for (const folder of structure) {
    await fs.ensureDir(path.join(projectDir, folder));
  }

  // Write gpm.json metadata
  const gpmConfig = {
    name: answers.name,
    engine: answers.engine,
    template: answers.template.toLowerCase(),
    description: answers.description,
    createdAt: new Date().toISOString(),
    author: process.env.USER || process.env.USERNAME || "Unknown",
    version: "0.1.0"
  };

  await fs.writeJson(path.join(projectDir, "gpm.json"), gpmConfig, { spaces: 2 });

  console.log(chalk.green("✅ Project folder structure created"));

  // Create dummy Godot project.godot file
  const projectGodotPath = path.join(projectPath, "project.godot");
  const godotTemplate = `[gd_project]
config_version=5

[application]
config/name="${answers.name}"
run/main_scene="res://scenes/main.tscn"
`;

  await fs.writeFile(projectGodotPath, godotTemplate);
  console.log(chalk.green("✅ Created project.godot"));

  // Done
  console.log(chalk.cyan("\n🎉 Project initialized successfully!"));
  console.log(chalk.gray(`Location: ${projectDir}`));
  console.log(chalk.green("\nNext steps:"));
  console.log(`  cd ${answers.name}`);
  console.log(`  gpm engine install ${answers.engine}`);
  console.log(`  gpm run\n`);
}
