import { validateReleaseManifest, type ReleaseValidationEnvironment, type ValidationSummary } from './validate_release_lib.mts';

const MANIFEST_PATH = new URL('./skill-package/skill.json', import.meta.url);
const OUTPUT_PATH = new URL('./release-validation.json', import.meta.url);

const denoEnv: ReleaseValidationEnvironment = {
  get(name: string): string | undefined {
    return Deno.env.get(name);
  },
};

async function writeStdout(message: string): Promise<void> {
  await Deno.stdout.write(new TextEncoder().encode(message));
}

async function writeStderr(message: string): Promise<void> {
  await Deno.stderr.write(new TextEncoder().encode(message));
}

async function persistSummary(summary: ValidationSummary): Promise<void> {
  await Deno.writeTextFile(OUTPUT_PATH, `${JSON.stringify(summary, null, 2)}\n`);
}

try {
  const summary = await validateReleaseManifest({
    env: denoEnv,
    manifestPath: MANIFEST_PATH,
    readTextFile: (fileUrl: URL): Promise<string> => Deno.readTextFile(fileUrl),
    stat: (fileUrl: URL): Promise<void> => Deno.stat(fileUrl).then((): void => undefined),
  });

  await persistSummary(summary);

  if (summary.status === 'failed') {
    await writeStderr(`${JSON.stringify(summary, null, 2)}\n`);
    Deno.exit(1);
  }

  await writeStdout(`${JSON.stringify(summary, null, 2)}\n`);
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected Alexa release validation failure.';
  await writeStderr(`${message}\n`);
  Deno.exit(1);
}
