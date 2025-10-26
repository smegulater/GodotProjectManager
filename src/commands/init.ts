import chalk from 'chalk';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import ini from 'ini';

import serveInitWizard from '../prompts/wizards/serveInitWizard.js';
import type ProjectGodotIni from '../types/ProjectGodotIni.js';
import { initReqMet } from '../prompts/answers.js';
import type { Gpmrc } from '../types/gpmrc.js';
import { installEngine } from './engine.js';
import { useEngine } from './use.js';
import { runPath } from '../utils/paths.js';

export async function initProject() {
	if (!(await initReqMet())) {
		return;
	}

	const godotFilePath = path.join(runPath, 'project.godot');

	// Step 1: detect Godot project
	if (!(await fs.pathExists(godotFilePath))) {
		console.log(chalk.red("No 'project.godot' found in this directory."));
		console.log(chalk.gray('\tPlease run this inside an existing Godot project.'));
		return;
	}

	const godotFile = fs.readFileSync(godotFilePath, 'utf-8');
	const godotFileParsed = ini.parse(godotFile) as ProjectGodotIni;

	// Step 2: ask for project details
	const answers = await serveInitWizard(godotFileParsed);

	// Step 3: Create gpm.json
	const gpmConfig = {
		name: answers.name,
		description: answers.description,
		engine: answers.engineVersion,
		template: answers.template.toLowerCase(),
		language: answers.renderingTemplate.mono ? 'mono' : 'gdscript',
		author: process.env.USER || process.env.USERNAME || 'Unknown',
		createdAt: new Date().toISOString(),
		version: answers.version,
	};

	await fs.writeJson(path.join(runPath, 'gpm.json'), gpmConfig, { spaces: 2 });

	// Step 4: Create .gpmrc
	const gpmrc: Gpmrc = {
		engineVersion: answers.engineVersion,
		mono: answers.renderingTemplate.mono,
	};
	await fs.writeJson(path.join(runPath, '.gpmrc'), gpmrc, { spaces: 2 });

	console.log(chalk.green('✅ Configuration files created.'));

	// Step 5: Install & link engine

	await installEngine({ mono: gpmrc.mono, isNew: false, installVersion: gpmrc.engineVersion });

	await useEngine(gpmrc.engineVersion);
	console.log(chalk.green(`✔ Engine ${gpmrc.engineVersion} linked to project.`));

	// Step 6: Optional Git setup
	if (answers.gitInit) {
		try {
			await execa('git', ['init'], { cwd: runPath });
			await execa('git', ['add', '.'], { cwd: runPath });
			await execa('git', ['commit', '-m', 'Initialize GPM project'], { cwd: runPath });
			console.log(chalk.green('✅ Initialized Git repository'));
		} catch {
			console.log(chalk.yellow('⚠️  Git not available, skipping repo setup.'));
		}
	}

	console.log(chalk.green(`\n🎉 Project '${answers.name}' created successfully!`));
	console.log(chalk.gray(`Location: ${runPath}`));
	console.log(chalk.green('\nNext steps:'));
	console.log('  gpm run        (launch project in Godot editor)');
	console.log('  gpm run test   (run test build)\n');
}
