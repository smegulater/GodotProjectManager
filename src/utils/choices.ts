import fs from 'fs';
import path from 'path';
import type { TemplateChoice, TemplateFile, TemplateJson } from "../types/template.js";


export async function getTemplateChoices(templateDir:string): Promise<TemplateChoice[]>{
// Get all files in the directory that match "template*.json"
	const templateFiles = fs
		.readdirSync(templateDir)
		.filter((f) => f.includes('template') && f.endsWith('.json'));

	// Map over each file and load its JSON data
	const templates = templateFiles.map((file): TemplateFile => {
		const fullPath = path.join(templateDir, file);
		const json = JSON.parse(fs.readFileSync(fullPath, 'utf-8')) as TemplateJson;
		return {
			file,
			fullPath,
			...json,
		};
	});

    const templateChoices = templates.map((t): TemplateChoice => ({
		name: `${t.name}\n    ${t.description || 'No description'}`,
		short: t.name,
		value: t,
	}));

    return templateChoices;
}

