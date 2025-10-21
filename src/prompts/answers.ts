import inquirer, { type Answers } from 'inquirer';
import { getGodotVersions, GodotReleaseType } from '../utils/godotVersions.js';
import { listEngines } from '../commands/engine.js';
import chalk from 'chalk';

export class FetchGodotVersionException extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'FetchGodotVersionException';
	}
}
export class NoInstalledEnginesException extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'NoInstalledEnginesException';
	}
}

export async function selectGodotVersionFromGodot(): Promise<string> {
	let godotVersions: string[] = [];

	try {
		godotVersions = await getGodotVersions(GodotReleaseType.Stable);
	} catch (err: any) {
		console.error('Failed to fetch versions', err.message);
		throw new FetchGodotVersionException('Failed to fetch versions from web');
	}

	const { engineValue } = await inquirer.prompt([
		{
			type: 'list',
			name: 'engineValue',
			message: 'Godot version:',
			choices: godotVersions,
		},
	]);

	return engineValue;
}

export async function selectGodotVersionFromInstalled(): Promise<Answers> {
	const installedEngines = await listEngines(true);

	if (installedEngines.length === 0) {
		throw new NoInstalledEnginesException('Could not detect any installed versions');
	}

	const answers: Answers = await inquirer.prompt([
		{
			type: 'checkbox',
			name: 'versions',
			message: 'Select engines to uninstall:',
			choices: installedEngines,
		},
	]);

	return answers;
}

export async function initReqMet() {
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

export async function overwriteProject(answers: Answers): Promise<boolean> {
	const { overwrite } = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'overwrite',
			message: `Folder '${answers.name}' already exists. Overwrite?`,
			default: false,
		},
	]);

	return !!overwrite;
}
