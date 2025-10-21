import { fileURLToPath } from 'url';
import { execa } from 'execa';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import { installEngine } from './engine.js';
import { useEngine } from './use.js';
import { jsonToConfig } from '../utils/jsonToConfig.js';
import { serveNewWizard } from '../prompts/wizards.js';
import type { GpmConfig } from '../types/gpmConfig.js';
import { overwriteProject } from '../prompts/answers.js';
import type { Answers } from 'inquirer';

const currentFileName = fileURLToPath(import.meta.url);
const CurrentDirectory = path.dirname(currentFileName);

export async function newProject() {
	// Step 1: run wizard to get required data
	const answers = await serveNewWizard();

	const projectDir = path.resolve(process.cwd(), answers.name);

	// Step 2: Handle overwrite
	await handleProjectOverwrite(projectDir, answers);

	//Step 3: Build project
	console.log('\n');
	console.log(chalk.cyan('⌛ Generating project...'));

	await createFolderStructure(projectDir);
	console.log(chalk.green('Folder structure created'));

	await createGpmJson(projectDir, answers);
	console.log(chalk.green('Default gpm.json file created'));

	await createGodotProject(projectDir, answers);
	console.log(chalk.green('Default project.godot file created'));

	await createDefaultScene(path.join(projectDir, 'project'), answers.template);
	console.log(chalk.green('Default scene: scenes/main.tscn created'));
	//Step 5: Set .gpmrc
	process.chdir(projectDir);

	//Step 3: (Optional) Git init
	if (answers.gitInit) {
		await initGit(projectDir, answers);
	}

	//Step 4: Auto-install engine
	const mono = answers.renderingTemplate.mono;
	await installEngine({ mono: mono, isNew: false, installVersion: answers.engine });

	try {
		await useEngine(answers.renderingTemplate.mono ? `${answers.engine}-mono` : answers.engine);
	} catch {
		chalk.red("Failed to set the engine for new project. Run 'gpm use' to set one ");
	}

	console.log(chalk.green(`\n🎉 Project '${answers.name}' created successfully!`));

	console.log(chalk.gray(`Location: ${projectDir}`));
	console.log(chalk.green('\nNext steps:'));
	console.log(`  cd ${answers.name}`);
	console.log('  gpm run        (launch project in Godot editor)');
	console.log('  gpm run test   (run test build)\n');
}

async function createGpmJson(projectDir: string, answers: Answers) {
	const gpmConfig: GpmConfig = {
		name: answers.name,
		description: answers.description,
		author: process.env.USER || process.env.USERNAME || 'Unknown',
		version: answers.version,
		engineVersion: answers.engine,
		renderer: answers.renderingTemplate.renderer,
		language: answers.renderingTemplate.mono ? 'mono' : 'gdscript',
		template: answers.template.toLowerCase(),
		createdAt: new Date().toISOString(),
		buildTemplate: answers.renderingTemplate.name,
	};
	await fs.writeJson(path.join(projectDir, 'gpm.json'), gpmConfig, {
		spaces: 2,
	});
}

async function createFolderStructure(projectDir: string) {
	const templateDir = path.join(CurrentDirectory, '..', 'templates');
	const structure = JSON.parse(await fs.readFileSync(path.join(templateDir, 'web.template.json'), 'utf-8'));

	for (const folder of structure) {
		await fs.ensureDir(path.join(projectDir, folder));
	}
}

async function handleProjectOverwrite(projectDir: string, answers: Answers) {
	if (fs.existsSync(projectDir)) {
		if (!(await overwriteProject(answers))) {
			console.log(chalk.red('Project creation canceled.'));
			process.exit(2);
		}
		await fs.remove(projectDir);
	}
}

async function createGodotProject(projectDir: string, answers: Answers) {
	const appConfig = answers.renderingTemplate.config.application;

	for (const key of Object.keys(appConfig)) {
		const value = appConfig[key];

		if (typeof value === 'string') {
			appConfig[key] = value
				.replace(/{{PROJECT_NAME}}/g, answers.name)
				.replace(/{{PROJECT_DESCRIPTION}}/g, answers.description)
				.replace(/{{PROJECT_VERSION}}/g, answers.version);
		}
	}

	// Generate config text
	const output = jsonToConfig(answers.renderingTemplate.config);

	await fs.writeFile(path.join(projectDir, 'project', 'project.godot'), output);
}

async function createDefaultScene(projectPath: string, template: string) {
	const sceneDir = path.join(projectPath, 'scenes');
	const sceneFile = path.join(sceneDir, 'main.tscn');
	const templateDir = path.join(CurrentDirectory, '..', 'templates');

	await fs.ensureDir(sceneDir);

	const sceneContent = JSON.parse(
		fs.readFileSync(path.join(templateDir, 'web.template.json'), 'utf-8').replace('{{template}}', template),
	);

	await fs.writeFile(sceneFile, sceneContent, 'utf8');

	// Update project.godot to reference the main scene
	const projectFile = path.join(projectPath, 'project.godot');

	let projectData = await fs.readFile(projectFile, 'utf8');

	if (!projectData.includes('run/main_scene')) {
		projectData += '\n[application]\nrun/main_scene="res://scenes/main.tscn"\n';
		await fs.writeFile(projectFile, projectData, 'utf8');
	}
}

async function initGit(projectDir: string, answers: Answers) {
	const templateDir = path.join(CurrentDirectory, '..', 'templates');

	const gitIgnore = JSON.parse(fs.readFileSync(path.join(templateDir, 'gitIgnore.template.json'), 'utf-8'));
	const gitAttr = JSON.parse(fs.readFileSync(path.join(templateDir, 'gitAttributes.template.json'), 'utf-8'));

	try {
		//write config files
		await fs.writeFile(path.join(projectDir, '.gitattributes'), gitAttr.join('\n'));
		// .gitignore
		await fs.writeFile(path.join(projectDir, '.gitignore'), gitIgnore.join('\n'));

		await execa('git', ['init'], { cwd: projectDir });

		if (answers.gitInitLfs) {
			await execa('git', ['lfs', 'install'], { cwd: projectDir });

			console.log(chalk.green('Initialized Git lfs'));
		}
		await execa('git', ['add', '.'], { cwd: projectDir });
		await execa('git', ['commit', '-m', 'Initial Commit'], {
			cwd: projectDir,
		});
		console.log(chalk.green('Initialized Git repository'));
	} catch (err: any) {
		console.log(chalk.yellow(`⚠️  Failed to init git -\n${err.message}`));
	}
}
