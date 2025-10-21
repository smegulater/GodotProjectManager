import fetch from 'node-fetch';

export const godotReleaseType = {
	Stable: 'stable',
	PreRelease: 'pre-release',
	Draft: 'draft',
	All: 'all',
} as const;

export type GodotReleaseType = (typeof godotReleaseType)[keyof typeof godotReleaseType];

const API_URL = 'https://api.github.com/repos/godotengine/godot/releases';

interface GitHubRelease {
	tag_name: string;
	draft: boolean;
	prerelease: boolean;
}

export async function getGodotVersions(type: GodotReleaseType): Promise<string[]> {
	const response = await fetch(API_URL);

	if (!response.ok) {
		throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
	}

	const data = (await response.json()) as GitHubRelease[];

	let filtered = data;

	switch (type) {
		case godotReleaseType.Stable:
			filtered = data.filter((r) => !r.prerelease && !r.draft);
			break;

		case godotReleaseType.PreRelease:
			filtered = data.filter((r) => r.prerelease && !r.draft);
			break;

		case godotReleaseType.Draft:
			filtered = data.filter((r) => r.draft);
			break;

		case godotReleaseType.All:
		default:
			// no filtering
			break;
	}

	// 🧩 Normalize, filter valid tags, and sort numerically
	const versions = filtered
		.map((r) => r.tag_name.replace(/^v/, '').replace(/-stable$/, '')) // remove "v" prefix if present
		.filter((tag) => /^[0-9]+\.[0-9]+(\.[0-9]+)?(-[a-z0-9.]+)?$/i.test(tag))
		.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

	return versions;
}
