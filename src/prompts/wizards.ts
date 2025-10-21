import chalk from 'chalk';
import path from 'path';
import inquirer, { type Answers } from 'inquirer';

import { getGodotVersions, GodotReleaseType } from '../utils/godotVersions.js';
import { getTemplateChoices } from '../utils/choices.js';

export async function serveInitWizard() {}

export async function serveNewWizard() {
	console.log(chalk.cyan('\n✨ Welcome to the Godot Project Manager Wizard! ✨'));
	console.log(chalk.gray('\tLet’s create a new project step-by-step.\n'));

	// build inquirer choices
	const templateDir: string = path.join(__dirname, '..', 'templates', 'projects');
	const templateChoices = await getTemplateChoices(templateDir);

	//get available versions
	const godotVersions = await getGodotVersions(GodotReleaseType.Stable).catch((err) => {
		console.error('❌ Failed to fetch versions:', err);
		process.exit(1);
	});

	const answers: Answers = await inquirer.prompt([
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
			name: 'engine',
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
