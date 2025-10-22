import { defineConfig, globalIgnores } from 'eslint/config';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default defineConfig([
	globalIgnores(['**/node_modules', '**/dist', '**/build', '**/coverage', '**/tests','**/*.js','**/*.mjs', 'jest.config.ts']),
	{
		extends: compat.extends(
			'eslint:recommended',
			'plugin:@typescript-eslint/recommended',
			'plugin:@typescript-eslint/recommended-requiring-type-checking',
			'plugin:prettier/recommended',
		),

		plugins: {
			'@typescript-eslint': typescriptEslint,
			prettier,
		},

		languageOptions: {
			globals: {
				...globals.node,
			},
			parser: tsParser,
			ecmaVersion: 'latest',
			sourceType: 'module',
			parserOptions: {
				project: ['./tsconfig.json'],
			},
		},

		rules: {
			// ✅ Let Prettier handle formatting
			'prettier/prettier': [
				'error',
				{
					useTabs: true,
					tabWidth: 1,
					printWidth: 120,
					singleQuote: true,
					semi: true,
					trailingComma: 'all',
					bracketSpacing: true,
					arrowParens: 'always',
					endOfLine: 'lf',
				},
			],

			// ❌ Remove ESLint rules that overlap with Prettier
			// quotes, semi, indent — Prettier will handle these

			// ✅ Keep logic and naming rules
			'@typescript-eslint/naming-convention': [
				'error',

				// Variables, functions, etc.
				{ selector: 'variableLike', format: ['camelCase'] },

				// Allow PascalCase for exported const objects (enum-like), camelCase, or UPPER_CASE for normal consts
				{
					selector: 'variable',
					modifiers: ['const'],
					format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
				},

				// Classes, interfaces, types, and enums
				{ selector: 'typeLike', format: ['PascalCase'] },

				// Enum members
				{ selector: 'enumMember', format: ['UPPER_CASE'] },
			],

			eqeqeq: ['error', 'always'],
			curly: ['error', 'all'],
			'@typescript-eslint/no-unused-vars': ['warn'],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/consistent-type-imports': 'error',
			'@typescript-eslint/no-floating-promises': 'error',
		},
	},
]);
