import { writeFile, readFile, stat } from 'node:fs/promises';

import { validateReleaseManifest, type ReleaseValidationEnvironment, type ValidationSummary } from './validate_release_lib.mts';

const MANIFEST_PATH = new URL('./skill-package/skill.json', import.meta.url);
const OUTPUT_PATH = new URL('./release-validation.json', import.meta.url);

const nodeEnv: ReleaseValidationEnvironment = {
  get(name: string): string | undefined {
    const value = process.env[name];
    return typeof value === 'string' ? value : undefined;
  },
};

async function persistSummary(summary: ValidationSummary): Promise<void> {
  await writeFile(OUTPUT_PATH, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
}

const summary = await validateReleaseManifest({
  env: nodeEnv,
  manifestPath: MANIFEST_PATH,
  readTextFile: (fileUrl: URL): Promise<string> => readFile(fileUrl, 'utf8'),
  stat: (fileUrl: URL): Promise<void> => stat(fileUrl).then((): void => undefined),
});

await persistSummary(summary);

if (summary.status === 'failed') {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
