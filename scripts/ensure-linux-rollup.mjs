import { spawnSync } from 'node:child_process';

if (process.platform !== 'linux') {
  process.exit(0);
}

const result = spawnSync(
  'npm',
  ['install', '--include=optional', '--no-save', '@rollup/rollup-linux-x64-gnu@4.65.0'],
  { stdio: 'inherit', shell: process.platform === 'win32' },
);

process.exit(result.status ?? 1);
