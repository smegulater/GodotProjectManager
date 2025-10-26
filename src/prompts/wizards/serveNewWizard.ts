import inquirer from 'inquirer';
import chalk from 'chalk';

import path from 'path';
import process from 'process';

import { getGodotVersions, GodotReleaseType } from '../../utils/godotVersions.js';
import type { TemplateFile } from '../../types/template.js';
import { getTemplateChoices } from '../../utils/choices.js';
import { installPath } from '../../utils/paths.js';

export interface NewWizardAnswers {
	name: string;
	description: string;
	version: string;
	template: '2d' | '3d';
	renderingTemplate: TemplateFile;
	engineVersion: string;
	gitInit: boolean;
	gitInitLfs: boolean;
}
export default async function serveNewWizard(): Promise<NewWizardAnswers> {
	console.log(chalk.cyan('\n✨ Welcome to the Godot Project Manager Wizard! ✨'));
	console.log(chalk.gray('\tLet’s create a new project step-by-step.\n'));

	// build inquirer choices
	const templateDir: string = path.join(installPath, 'templates', 'projects');
	const templateChoices = getTemplateChoices(templateDir);

	//get available versions
	const godotVersions = await getGodotVersions(GodotReleaseType.Stable).catch((err) => {
		console.error('Failed to fetch versions:', err);
		process.exit(1);
	});

	const answers = await inquirer.prompt<NewWizardAnswers>([
		{
			type: 'input',
			name: 'name',
			message: 'Project name:',
			default: 'my-godot-project',
			validate: (input: string) => !!input.trim() || 'Project name cannot be empty.',
		},
		{
			type: 'input',
			name: 'description',
			message: 'Description:',
			default: 'A new Godot project generated with GPM',
		},
		{
			type: 'input',
			name: 'version',
			message: 'Version:',
			default: '1.0.0',
		},
		{
			type: 'list',
			name: 'template',
			message: 'Project template:',
			choices: ['2D', '3D'],
			default: '2D',
		},
		{
			type: 'list',
			name: 'renderingTemplate',
			message: 'rendering Template:',
			choices: templateChoices,
		},
		{
			type: 'list',
			name: 'engineVersion',
			message: 'Godot version:',
			choices: godotVersions,
		},
		{
			type: 'confirm',
			name: 'gitInit',
			message: 'Initialize Git repository?',
			default: true,
		},
		{
			type: 'confirm',
			name: 'gitInitLfs',
			message: 'Initialize Git lfs?',
			default: true,
		},
	]);

	return answers;
}
