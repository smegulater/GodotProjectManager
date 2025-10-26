import inquirer from 'inquirer';
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
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('Failed to fetch versions', message);
		throw new FetchGodotVersionException('Failed to fetch versions from web');
	}

	const { engineValue } = await inquirer.prompt<{ engineValue: string }>([
		{
			type: 'list',
			name: 'engineValue',
			message: 'Godot version:',
			choices: godotVersions,
		},
	]);

	return engineValue;
}

export async function selectGodotVersionFromInstalled(): Promise<string[]> {
	const installedEngines = await listEngines(true);

	if (installedEngines.length === 0) {
		throw new NoInstalledEnginesException('Could not detect any installed versions');
	}

	const { versions } = await inquirer.prompt<{ versions: string[] }>([
		{
			type: 'checkbox',
			name: 'versions',
			message: 'Select engines to uninstall:',
			choices: installedEngines,
		},
	]);

	return versions;
}

export async function initReqMet(): Promise<boolean> {
	console.log(chalk.yellow.bold('\n⚠️  WARNING  ⚠️'));
	console.log(chalk.yellow('Before continuing, please make sure you:'));
	console.log(chalk.yellow(' - Have created a backup of your project.'));
	console.log(chalk.yellow(' - Have closed Godot completely.\n'));

	const { confirmContinue } = await inquirer.prompt<{ confirmContinue: boolean }>([
		{
			type: 'confirm',
			name: 'confirmContinue',
			message: 'Do you want to continue?',
			default: false,
		},
	]);

	return confirmContinue;
}

export async function overwriteProject(): Promise<boolean> {
	const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
		{
			type: 'confirm',
			name: 'overwrite',
			message: `Overwrite?`,
			default: false,
		},
	]);

	return !!overwrite;
}
