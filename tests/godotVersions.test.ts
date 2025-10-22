import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Response } from 'node-fetch';

// 🧩 Must mock before importing getGodotVersions
jest.unstable_mockModule('node-fetch', () => ({
	__esModule: true,
	default: jest.fn(),
}));

// ✅ Dynamically import your module after the mock is active
const { default: fetch } = await import('node-fetch');
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

// Import the module under test AFTER the mock
const { getGodotVersions, GodotReleaseType } = await import('../src/utils/godotVersions.js');

// Example mock payload
const mockReleases = [
	{ tag_name: '4.5.1-stable', draft: false, prerelease: false },
	{ tag_name: '4.6-beta1', draft: false, prerelease: true },
	{ tag_name: '4.7-dev', draft: true, prerelease: false },
	{ tag_name: 'invalid-tag', draft: false, prerelease: false },
];

describe('getGodotVersions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns only stable versions', async () => {
		mockedFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockReleases), { status: 200 }) as any);

		const versions = await getGodotVersions(GodotReleaseType.Stable);
		expect(versions).toEqual(['4.5.1']);
	});

	it('returns only pre-releases', async () => {
		mockedFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockReleases), { status: 200 }) as any);

		const versions = await getGodotVersions(GodotReleaseType.PreRelease);
		expect(versions).toEqual(['4.6-beta1']);
	});

	it('returns only drafts', async () => {
		mockedFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockReleases), { status: 200 }) as any);

		const versions = await getGodotVersions(GodotReleaseType.Draft);
		expect(versions).toEqual(['4.7-dev']);
	});

	it('returns all valid version tags when type=All', async () => {
		mockedFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockReleases), { status: 200 }) as any);

		const versions = await getGodotVersions(GodotReleaseType.All);
		expect(versions).toEqual(['4.7-dev', '4.6-beta1', '4.5.1']);
	});

	it('throws an error on non-200 response', async () => {
		mockedFetch.mockResolvedValueOnce(new Response(null, { status: 500, statusText: 'Server Error' }) as any);

		await expect(getGodotVersions(GodotReleaseType.Stable)).rejects.toThrow(/GitHub API error: 500 Server Error/);
	});
});
