import inquirer, { type Answers } from "inquirer";
import { fileURLToPath } from "url";
import { execa } from "execa";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

import { installEngine } from "./engine.js";
import { useEngine } from "./use.js";
import { jsonToConfig } from "../utils/jsonToConfig.js";
import { getGodotVersions, GodotReleaseType } from "../utils/godotVersions.js";

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
  //Step 5: Set .gpmrc
  process.chdir(projectDir);

  //Step 3: (Optional) Git init
  if (answers.gitInit) {
    await InitGit(projectDir, answers);
  }

  //Step 4: Auto-install engine
  const mono = answers.renderingTemplate.mono;
  console.log(
    chalk.cyan(
      `Checking for Godot ${answers.engine} (${mono ? "Mono" : "GDScript"})...`
    )
  );
  await installEngine({mono: mono, isNew: false, installVersion: answers.engine});

  try {
    await useEngine(
      answers.renderingTemplate.mono ? `${answers.engine}-mono` : answers.engine
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
    version: answers.version,
    engineVersion: answers.engine,
    renderer: answers.renderingTemplate.renderer,
    language: answers.renderingTemplate.mono ? "mono" : "gdscript",
    template: answers.template.toLowerCase(),
    createdAt: new Date().toISOString(),
    buildTemplate: answers.renderingTemplate.name,
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

  const templateDir: string = path.join(
    __dirname,
    "..",
    "templates",
    "projects"
  );
  const templateFiles = await fs
    .readdirSync(templateDir)
    .filter((f) => f.includes("template") && f.endsWith(".json"));

  const templates = templateFiles.map((file) => {
    const fullPath = path.join(templateDir, file);
    const json = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    return {
      file,
      fullPath,
      ...json,
    };
  });

  // build inquirer choices
  const templateChoices = templates.map((t) => ({
    name: `${t.name}\n    ${t.description || "No description"}`,
    short: t.name,
    value: t,
  }));

  //get available versions
  const godotVersions = await getGodotVersions(GodotReleaseType.Stable).catch(
    (err) => {
      console.error("❌ Failed to fetch versions:", err);
      process.exit(1);
    }
  );

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
      choices: templateChoices,
    },
    {
      type: "list",
      name: "engine",
      message: "Godot version:",
      choices: godotVersions,
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
  const appConfig = answers.renderingTemplate.config.application;

  for (const key of Object.keys(appConfig)) {
    const value = appConfig[key];

    if (typeof value === "string") {
      appConfig[key] = value
        .replace(/{{PROJECT_NAME}}/g, answers.name)
        .replace(/{{PROJECT_DESCRIPTION}}/g, answers.description)
        .replace(/{{PROJECT_VERSION}}/g, answers.version);
    }
  }

  // Generate config text
  const output = jsonToConfig(answers.renderingTemplate.config);

  await fs.writeFile(path.join(projectDir, "project", "project.godot"), output);
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
  const templateDir = path.join(__dirname, "..", "templates");

  const gitIgnore = JSON.parse(
    await fs.readFileSync(
      path.join(templateDir, "gitIgnore.template.json"),
      "utf-8"
    )
  );
  const gitAttr = JSON.parse(
    await fs.readFileSync(
      path.join(templateDir, "gitAttributes.template.json"),
      "utf-8"
    )
  );

  try {
    //write config files
    await fs.writeFile(
      path.join(projectDir, ".gitattributes"),
      gitAttr.join("\n")
    );
    // .gitignore
    await fs.writeFile(
      path.join(projectDir, ".gitignore"),
      gitIgnore.join("\n")
    );

    await execa("git", ["init"], { cwd: projectDir });

    if (answers.gitInitLfs) {
      await execa("git", ["lfs", "install"], { cwd: projectDir });

      console.log(chalk.green("Initialized Git lfs"));
    }
    await execa("git", ["add", "."], { cwd: projectDir });
    await execa("git", ["commit", "-m", "Initial Commit"], {
      cwd: projectDir,
    });
    console.log(chalk.green("Initialized Git repository"));
  } catch (err: any) {
    console.log(chalk.yellow(`⚠️  Failed to init git -\n${err.message}`));
  }
}
