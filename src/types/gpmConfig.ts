export interface GpmConfig {
	name: string;
	description: string;
	version: string;
	author: string;

	template: '2d' | '3d';
	engineVersion: string;
	renderer: string;
	language: string;
	createdAt: string;
	buildTemplate?: string;
}
