import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import ini from 'ini';

import { useEngine } from './use.js';
import { installEngine } from './engine.js';
import { initReqMet } from '../prompts/answers.js';

import serveInitWizard from '../prompts/wizards/serveInitWizard.js';
import type ProjectGodotIni from '../types/ProjectGodotIni.js';
import type { Gpmrc } from '../types/gpmrc.js';

export async function initProject() {
	if (!(await initReqMet())) {
		return;
	}

	const cwd = process.cwd();
	const godotFilePath = path.join(cwd, 'project.godot');

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
		language: answers.renderingTemplate.value.mono ? 'mono' : 'gdscript',
		author: process.env.USER || process.env.USERNAME || 'Unknown',
		createdAt: new Date().toISOString(),
		version: answers.version,
	};

	await fs.writeJson(path.join(cwd, 'gpm.json'), gpmConfig, { spaces: 2 });

	// Step 4: Create .gpmrc
	const gpmrc: Gpmrc = {
		engineVersion: answers.engineVersion,
		mono: answers.renderingTemplate.value.mono,
	};
	await fs.writeJson(path.join(cwd, '.gpmrc'), gpmrc, { spaces: 2 });

	console.log(chalk.green('✅ Configuration files created.'));

	// Step 5: Install & link engine

	await installEngine({ mono: gpmrc.mono, isNew: false, installVersion: gpmrc.engineVersion });

	await useEngine(gpmrc.engineVersion);
	console.log(chalk.green(`✔ Engine ${gpmrc.engineVersion} linked to project.`));

	// Step 6: Optional Git setup
	if (answers.gitInit) {
		try {
			const { execa } = await import('execa');
			await execa('git', ['init'], { cwd });
			await execa('git', ['add', '.'], { cwd });
			await execa('git', ['commit', '-m', 'Initialize GPM project'], { cwd });
			console.log(chalk.green('✅ Initialized Git repository'));
		} catch {
			console.log(chalk.yellow('⚠️  Git not available, skipping repo setup.'));
		}
	}

	console.log(chalk.green(`\n🎉 Project '${answers.name}' created successfully!`));
	console.log(chalk.gray(`Location: ${cwd}`));
	console.log(chalk.green('\nNext steps:'));
	console.log('  gpm run        (launch project in Godot editor)');
	console.log('  gpm run test   (run test build)\n');
}
