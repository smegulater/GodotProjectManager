// types.ts
export interface TemplateConfig {
	config_version: number;
	application: Record<string, unknown>;
	display: Record<string, unknown>;
	[key: string]: unknown;
}

export interface TemplateJson {
	name: string;
	description: string;
	mono: boolean;
	renderer: string;
	config: TemplateConfig;
	[key: string]: unknown; // allow extra optional keys
}

export interface TemplateFile extends TemplateJson {
	file: string;
	fullPath: string;
}

export interface TemplateChoice{
    name: string
    short: string
    value: TemplateFile
}