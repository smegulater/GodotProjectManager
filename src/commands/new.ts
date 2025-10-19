import inquirer, { type Answers } from "inquirer";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { installEngine } from "./engine.js";
import { useEngine } from "./use.js";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function newProject() {
  // Step 1: run wizard to get required data
  const answers = await ServeWizard();

  const projectDir = path.resolve(process.cwd(), answers.name);

  // Step 2: Handle overwrite
  await HandleProjectOverwrite(projectDir, answers);

  //Step 3: Build project
  console.log("\n");
  console.log(chalk.cyan("⌛ Generating project..."));

  await CreateFolderStructure(projectDir);
  console.log(chalk.green("Folder structure created"));

  await CreateGpmJson(projectDir, answers);
  console.log(chalk.green("Default gpm.json file created"));

  await CreateGodotProject(projectDir, answers);
  console.log(chalk.green("Default project.godot file created"));

  await createDefaultScene(path.join(projectDir, "project"), answers.template);
  console.log(chalk.green("Default scene: scenes/main.tscn created"));

  //Step 3: (Optional) Git init
  if (answers.gitInit) {
    await InitGit(projectDir, answers);
    console.log(chalk.green("Git initialised"));
  }

  //Step 4: (Optional) Auto-install engine
  if (answers.autoInstall) {
    const mono = answers.language.includes("C#");
    console.log(
      chalk.cyan(
        `Checking for Godot ${answers.engine} (${
          mono ? "Mono" : "GDScript"
        })...`
      )
    );
    await installEngine(answers.engine, "stable", mono);
  }

  //Step 5: Set .gpmrc
  process.chdir(projectDir);
  try {
    await useEngine(
      answers.language === "GDScript"
        ? answers.engine
        : `${answers.engine}-mono`
    );
  } catch (error: any) {
    chalk.red(
      `Failed to set the engine for new project. Run 'gpm use' to set one `
    );
  }

  console.log(
    chalk.green(`\n🎉 Project '${answers.name}' created successfully!`)
  );

  console.log(chalk.gray(`Location: ${projectDir}`));
  console.log(chalk.green("\nNext steps:"));
  console.log(`  cd ${answers.name}`);
  console.log(`  gpm run        (launch project in Godot editor)`);
  console.log(`  gpm run test   (run test build)\n`);
}

async function CreateGpmJson(projectDir: string, answers: Answers) {
  const gpmConfig = {
    name: answers.name,
    description: answers.description,
    author: process.env.USER || process.env.USERNAME || "Unknown",
    engine: answers.engine,
    renderer: answers.renderingTemplate,
    language: answers.language.includes("C#") ? "mono" : "gdscript",
    template: answers.template.toLowerCase(),
    createdAt: new Date().toISOString(),
    version: answers.version,
  };
  await fs.writeJson(path.join(projectDir, "gpm.json"), gpmConfig, {
    spaces: 2,
  });
}

async function CreateFolderStructure(projectDir: string) {
  const structure = [
    "project/src",
    "project/src",
    "project/scenes",
    "project/assets",
    "project/tests",
    "project/addons",
    "build",
    "scripts",
  ];
  for (const folder of structure)
    await fs.ensureDir(path.join(projectDir, folder));
}

async function ServeWizard() {
  console.log(
    chalk.cyan("\n✨ Welcome to the Godot Project Manager Wizard! ✨")
  );
  console.log(chalk.gray("\tLet’s create a new project step-by-step.\n"));

  const answers: Answers = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Project name:",
      default: "my-godot-project",
      validate: (input: string) =>
        !!input.trim() || "Project name cannot be empty.",
    },
    {
      type: "input",
      name: "description",
      message: "Description:",
      default: "A new Godot project generated with GPM",
    },
    {
      type: "input",
      name: "version",
      message: "Version:",
      default: "1.0.0",
    },
    {
      type: "list",
      name: "template",
      message: "Project template:",
      choices: ["2D", "3D"],
      default: "2D",
    },
    {
      type: "list",
      name: "renderingTemplate",
      message: "rendering Template:",
      choices: ["Desktop", "Mobile", "Web"],
      default: "Desktop",
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
      message: "Download engine automatically if not installed?",
      default: true,
    },
    {
      type: "confirm",
      name: "gitInit",
      message: "Initialize Git repository?",
      default: true,
    },
    {
      type: "confirm",
      name: "gitInitLfs",
      message: "Initialize Git lfs?",
      default: true,
    },
  ]);

  return answers;
}

async function HandleProjectOverwrite(projectDir: string, answers: Answers) {
  if (fs.existsSync(projectDir)) {
    const confirm = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: `Folder '${answers.name}' already exists. Overwrite?`,
        default: false,
      },
    ]);
    if (!confirm.overwrite) {
      console.log(chalk.red("❌ Project creation canceled."));
      process.exit(2);
    }
    await fs.remove(projectDir);
  }
}

async function CreateGodotProject(projectDir: string, answers: Answers) {
  let templatePath: string = "";
  switch (answers.renderingTemplate) {
    case "Desktop":
      templatePath = path.join(
        __dirname,
        "..",
        "templates",
        "desktop.project.godot"
      );
      break;
    case "Mobile":
      templatePath = path.join(
        __dirname,
        "..",
        "templates",
        "mobile.project.godot"
      );
      break;
    case "Web":
      templatePath = path.join(
        __dirname,
        "..",
        "templates",
        "web.project.godot"
      );
      break;
    default:
      templatePath = path.join(__dirname, "..", "templates", "project.godot");
      break;
  }
  let godotFile = await fs.readFile(templatePath, "utf8");

  // Replace placeholders
  godotFile = godotFile
    .replace("{{PROJECT_NAME}}", answers.name)
    .replace("{{PROJECT_DESCRIPTION}}", answers.description)
    .replace("{{PROJECT_VERSION}}", answers.version);

  // Write to destination
  const outputPath = path.join(projectDir, "project", "project.godot");
  await fs.writeFile(outputPath, godotFile);
}

async function createDefaultScene(projectPath: string, template: string) {
  const sceneDir = path.join(projectPath, "scenes");
  const sceneFile = path.join(sceneDir, "main.tscn");
  await fs.ensureDir(sceneDir);

  const sceneContent = `[gd_scene format=3]

[node name="Main" type="Node${template}"]
`;

  await fs.writeFile(sceneFile, sceneContent, "utf8");

  // Update project.godot to reference the main scene
  const projectFile = path.join(projectPath, "project.godot");
  let projectData = await fs.readFile(projectFile, "utf8");

  if (!projectData.includes("run/main_scene")) {
    projectData += `\n[application]\nrun/main_scene="res://scenes/main.tscn"\n`;
    await fs.writeFile(projectFile, projectData, "utf8");
  }
}

async function InitGit(projectDir: string, answers: Answers) {
  try {
    await fs.writeFile(path.join(projectDir, ".gitattributes"), "");
    // .gitignore
    await fs.writeFile(
      path.join(projectDir, ".gitignore"),
      [
        "### Godot ###",
        "# Godot 4+ specific ignores",
        ".godot/",
        "",
        "# Godot-specific ignores",
        ".import/",
        "export.cfg",
        "export_presets.cfg",
        "",
        "# Imported translations (automatically generated from CSV files)",
        "*.translation",
        "",
        "# Mono-specific ignores",
        ".mono/",
        "data_*/",
        "mono_crash.*.json",
      ].join("\n") + "\n"
    );

    const { execa } = await import("execa");
    await execa("git", ["add", "."], { cwd: projectDir });
    await execa("git", ["commit", "-m", "Init Git LFS"], {
      cwd: projectDir,
    });
    console.log(chalk.green("Initialized Git repository"));
    if (answers.gitInitLfs) {
      await execa("git", ["lfs", "install"], { cwd: projectDir });
      await fs.appendFile(
        path.join(projectDir, ".gitattributes"),
        [
          "# Godot binary resources",
          "*.res filter=lfs diff=lfs merge=lfs -text",
          "*.tres filter=lfs diff=lfs merge=lfs -text",
          "",
          "# Godot imported assets (optional)",
          "*.import filter=lfs diff=lfs merge=lfs -text",
          "",
          "# 3D and image assets",
          "*.png filter=lfs diff=lfs merge=lfs -text",
          "*.jpg filter=lfs diff=lfs merge=lfs -text",
          "*.jpeg filter=lfs diff=lfs merge=lfs -text",
          "*.tga filter=lfs diff=lfs merge=lfs -text",
          "*.webp filter=lfs diff=lfs merge=lfs -text",
          "*.glb filter=lfs diff=lfs merge=lfs -text",
          "*.fbx filter=lfs diff=lfs merge=lfs -text",
          "*.blend filter=lfs diff=lfs merge=lfs -text",
          "",
          "# Audio and video",
          "*.wav filter=lfs diff=lfs merge=lfs -text",
          "*.ogg filter=lfs diff=lfs merge=lfs -text",
          "*.mp3 filter=lfs diff=lfs merge=lfs -text",
          "*.mp4 filter=lfs diff=lfs merge=lfs -text",
        ].join("\n") + "\n"
      );
      console.log(chalk.green("Initialized Git lfs"));
    }
  } catch {
    console.log(chalk.yellow("⚠️  Git not available, skipping repo creation."));
  }
}
