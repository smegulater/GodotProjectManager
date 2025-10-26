/* eslint-disable @typescript-eslint/naming-convention */
import { fileURLToPath } from 'url';
import path, { dirname, resolve } from 'path';
import process from 'process';

// === 1️⃣ Where the command was run ===
export const runPath: string = process.cwd();

// === 2️⃣ Where the CLI is installed ===
// Resolve to the directory of the compiled file (e.g., dist/commands/new.js)
const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

// Typically one level up from dist/ → the package root
export const installPath: string = resolve(path.join(__dirname, '..'));
