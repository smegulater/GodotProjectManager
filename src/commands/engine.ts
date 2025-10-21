import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import AdmZip from 'adm-zip';
import type { Answers } from 'inquirer';

import { downloadFile } from '../utils/download.js';

import { selectGodotVersionFromGodot, selectGodotVersionFromInstalled } from '../prompts/answers.js';

type InstallEngineOptions = {
	mono: boolean;
	isNew: boolean;
	installVersion?: string;
};

export function getEngineDir() {
	const home = process.env.HOME || process.env.USERPROFILE;
	const dir = path.join(home!, '.gpm', 'engines');
	fs.ensureDirSync(dir);
	return dir;
}

export async function installEngine({ mono, isNew, installVersion }: InstallEngineOptions) {
	const projectDir: string = process.cwd();
	const enginesPath: string = getEngineDir();
	const flavor: string = 'stable';

	let version: string = '';

	if (isNew) {
		//get available versions
		version = await selectGodotVersionFromGodot();
	} else if (installVersion) {
		version = installVersion ? installVersion : '';
	} else {
		const result = await getLocalConfigVersion(projectDir);
		version = result?.version ?? '';
		mono = result?.mono ?? false;
	}

	if (version === '') {
		console.log(chalk.red('No project config found. '));
		console.log(chalk.gray('Run inside a GPM project folder or run with the --new flag to select a version.'));
		process.exitCode = 1;
	}

	if (await checkForExistingInstallation(enginesPath, version, mono)) {
		console.log(chalk.grey(`Godot ${version} ${flavor} already installed`));
		return;
	}

	const spinner = ora(`Installing Godot ${version} (${flavor})...`).start();

	try {
		const extractDir = path.join(enginesPath, `${version}${mono ? '-mono' : ''}`);

		let slug = '',
			platformParam = '',
			fileName = '';

		const platform = process.platform;

		if (platform === 'win32') {
			slug = mono ? 'mono_win64.zip' : 'win64.exe.zip';
			platformParam = 'windows.64';
			fileName = mono ? `Godot_v${version}_${flavor}_mono_win64.zip` : `Godot_v${version}_${flavor}_win64.zip`;
		} else if (platform === 'darwin') {
			slug = mono ? 'mono_macos.universal.zip' : 'macos.universal.zip';
			platformParam = 'macos.universal';
			fileName = mono
				? `Godot_v${version}_${flavor}_mono_macos.universal.zip`
				: `Godot_v${version}_${flavor}_macos.universal.zip`;
		} else {
			slug = mono ? 'mono_linux_x86_64.zip' : 'linux.x86_64.zip';
			platformParam = 'linux.64';
			fileName = mono
				? `Godot_v${version}_${flavor}_mono_linux_x86_64.zip`
				: `Godot_v${version}_${flavor}_linux_x86_64.zip`;
		}

		const url = `https://downloads.godotengine.org/?version=${version}&flavor=${flavor}&slug=${slug}&platform=${platformParam}`;
		const destZip = path.join(enginesPath, fileName);

		spinner.text = chalk.cyan(`⬇ Downloading Godot ${version}${mono ? ' (Mono)' : ''}...`);
		await downloadFile(url, destZip);

		spinner.text = chalk.cyan('Extracting engine...');
		await fs.ensureDir(extractDir);

		const zip = new AdmZip(destZip);
		zip.extractAllTo(extractDir, true);
		await fs.remove(destZip);

		spinner.succeed(chalk.green(`Godot ${version} ${flavor} installed successfully!`));
		console.log(chalk.gray(`→ Installed at: ${extractDir}`));
	} catch (err: any) {
		spinner.fail(chalk.red(`Failed to install Godot ${version}: ${err.message}`));

		// 🧹 Make sure spinner is stopped and process terminates
		spinner.stop();
		process.exitCode = 1; // mark command as failed
	} finally {
		// 🧹 Ensure no spinners or downloaded files
		spinner.stop();

		try {
			const files = await fs.readdir(enginesPath);

			const zipFiles = files.filter((file) => file.endsWith('.zip'));
			if (zipFiles.length === 0) {
				console.log('No .zip files found.');
				return;
			}

			for (const file of zipFiles) {
				const fullPath = path.join(enginesPath, file);
				await fs.unlink(fullPath);
				console.log(chalk.grey(`🗑️ Cleaned up install file: ${file}`));
			}
		} catch (err) {
			console.error(chalk.red('Failed to clean up install files'), err);
		}
	}
}

export async function uninstallEngine() {
	const enginesPath = getEngineDir();

	let answers: Answers;
	try {
		answers = await selectGodotVersionFromInstalled();
	} catch (err: any) {
		console.log('No Engines installed. Exiting.');
		return;
	}

	if (answers.versions.length === 0) {
		console.log(chalk.yellow('No options selected. Exiting.'));
		return;
	}

	for (const version of answers.versions) {
		const spinner = ora(`Uninstalling Godot ${version} ...`).start();
		try {
			await fs.remove(path.join(enginesPath, version));
			spinner.succeed(`Uninstalled ${version} successfully`);
		} catch (error: any) {
			spinner.fail(`Failed to uninstall ${version} due to: ${error}`);
		}
	}
}

export async function listEngines(hideOutput: boolean = false) {
	const enginesPath = getEngineDir();
	const dirs: Array<string> = await fs.readdir(enginesPath);

	if (!hideOutput) {
		console.log(chalk.cyan('Installed Godot engines:'));
		for (const dir of dirs) {
			console.log(` - ${dir}`);
		}
	}
	return dirs;
}

async function checkForExistingInstallation(enginesPath: string, version: string, mono: boolean) {
	const extractDir = path.join(enginesPath, `${version}${mono ? '-mono' : ''}`);
	let exists: boolean = false;
	if (await fs.pathExists(extractDir)) {
		exists = true;
		console.log(chalk.green(`Godot ${version}${mono ? ' (Mono)' : ''} installation already exists.`));
	}

	return exists;
}

async function getLocalConfigVersion(projectDir: string): Promise<{ version: string; mono: boolean } | undefined> {
	const gpmrcPath = path.join(projectDir, '.gpmrc');
	const gpmJsonPath = path.join(projectDir, 'gpm.json');

	if (await fs.existsSync(gpmrcPath)) {
		const gpmrc = await fs.readJson(gpmrcPath);
		return { version: gpmrc.engineVersion, mono: gpmrc.mono };
	} else if (fs.existsSync(gpmJsonPath)) {
		const gpmConfig = await fs.readJson(gpmJsonPath);
		return { version: gpmConfig.engine, mono: gpmConfig.language === 'mono' };
	}
}
