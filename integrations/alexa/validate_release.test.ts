import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import {
  validateReleaseManifest,
  type AlexaSkillManifest,
  type ReleaseValidationEnvironment,
} from './validate_release_lib.mts';

interface TestWorkspace {
  manifestPath: URL;
  rootPath: string;
}

function createEnv(overrides: Record<string, string | undefined>): ReleaseValidationEnvironment {
  return {
    get(name: string): string | undefined {
      return overrides[name];
    },
  };
}

function createManifest(): AlexaSkillManifest {
  return {
    manifest: {
      accountLinking: {
        accessTokenUrl: 'https://app.dreyk.com/api/alexa/account-linking/token',
        authorizationUrl: 'https://app.dreyk.com/api/alexa/account-linking/authorize',
        clientId: 'dreyk-alexa-account-linking',
        clientSecret: 'ALEXA_ACCOUNT_LINKING_CLIENT_SECRET_FROM_SECRET_STORE',
      },
      apis: {
        custom: {
          endpoint: {
            uri: 'https://dreyk.functions.supabase.co/alexa-skill-runtime',
          },
        },
      },
      events: {
        endpoint: {
          uri: 'https://dreyk.functions.supabase.co/alexa-skill-webhook',
        },
      },
      privacyAndCompliance: {
        locales: {
          'en-US': {
            privacyPolicyUrl: 'https://app.dreyk.com/legal/privacy',
            termsOfUseUrl: 'https://app.dreyk.com/legal/terms',
          },
        },
      },
      publishingInformation: {
        locales: {
          'en-US': {
            largeIconUri: 'file://assets/images/en-US_largeIcon.png',
            smallIconUri: 'file://assets/images/en-US_smallIcon.png',
          },
        },
      },
    },
  };
}

const workspaces: string[] = [];

async function createWorkspace(input: { manifest: AlexaSkillManifest; withAssets: boolean }): Promise<TestWorkspace> {
  const rootPath = await mkdtemp(`${tmpdir()}/dreyk-alexa-release-`);
  const packagePath = `${rootPath}/skill-package`;
  const imagesPath = `${packagePath}/assets/images`;
  workspaces.push(rootPath);

  await mkdir(imagesPath, { recursive: true });
  await writeFile(`${packagePath}/skill.json`, `${JSON.stringify(input.manifest, null, 2)}\n`, 'utf8');

  if (input.withAssets) {
    await writeFile(`${imagesPath}/en-US_smallIcon.png`, 'small-icon', 'utf8');
    await writeFile(`${imagesPath}/en-US_largeIcon.png`, 'large-icon', 'utf8');
  }

  return {
    manifestPath: new URL(`file://${packagePath}/skill.json`),
    rootPath,
  };
}

afterEach(async () => {
  await Promise.all(
    workspaces.splice(0).map((workspacePath: string): Promise<void> => rm(workspacePath, { force: true, recursive: true })),
  );
});

describe('validateReleaseManifest', () => {
  it('passes when manifest assets and release evidence are complete', async () => {
    const workspace = await createWorkspace({
      manifest: createManifest(),
      withAssets: true,
    });

    const summary = await validateReleaseManifest({
      env: createEnv({
        ALEXA_RELEASE_EVIDENCE_DELIVERY: 'delivered: proactive event smoke passed',
        ALEXA_RELEASE_EVIDENCE_INSTALL: 'installed: test account enablement succeeded',
        ALEXA_RELEASE_EVIDENCE_LINKING: 'linked: account linking roundtrip succeeded',
        ALEXA_RELEASE_EVIDENCE_RUNTIME_INVOKE: 'invoked: readiness intent returned ready',
      }),
      manifestPath: workspace.manifestPath,
      readTextFile: (fileUrl: URL): Promise<string> => readFile(fileUrl, 'utf8'),
      stat: (fileUrl: URL): Promise<void> => stat(fileUrl).then((): void => undefined),
    });

    expect(summary.status).toBe('passed');
    expect(summary.errors).toEqual([]);
    expect(summary.evidence).toEqual({
      delivery: 'delivered: proactive event smoke passed',
      install: 'installed: test account enablement succeeded',
      linking: 'linked: account linking roundtrip succeeded',
      runtimeInvoke: 'invoked: readiness intent returned ready',
    });
  });

  it('fails and identifies missing release inputs', async () => {
    const manifest = createManifest();
    manifest.manifest.accountLinking.authorizationUrl = 'https://placeholder.example.com/{{replace_in_console}}';

    const workspace = await createWorkspace({
      manifest,
      withAssets: false,
    });

    const summary = await validateReleaseManifest({
      env: createEnv({
        ALEXA_RELEASE_EVIDENCE_INSTALL: 'installed: pending review',
        ALEXA_RELEASE_EVIDENCE_LINKING: 'linked: pending review',
        ALEXA_RELEASE_EVIDENCE_RUNTIME_INVOKE: 'invoked: pending review',
      }),
      manifestPath: workspace.manifestPath,
      readTextFile: (fileUrl: URL): Promise<string> => readFile(fileUrl, 'utf8'),
      stat: (fileUrl: URL): Promise<void> => stat(fileUrl).then((): void => undefined),
    });

    expect(summary.status).toBe('failed');
    expect(summary.errors).toContain('Authorization URL still contains a placeholder value.');
    expect(summary.errors).toContain('Missing required Alexa asset: file://assets/images/en-US_smallIcon.png.');
    expect(summary.errors).toContain('Missing required Alexa asset: file://assets/images/en-US_largeIcon.png.');
    expect(summary.errors).toContain('Missing delivery evidence: set ALEXA_RELEASE_EVIDENCE_DELIVERY.');
  });

  it('stores delivery failure evidence with the failure reason', async () => {
    const workspace = await createWorkspace({
      manifest: createManifest(),
      withAssets: true,
    });

    const summary = await validateReleaseManifest({
      env: createEnv({
        ALEXA_RELEASE_EVIDENCE_DELIVERY: 'failed: Amazon timeout during proactive event smoke',
        ALEXA_RELEASE_EVIDENCE_INSTALL: 'installed: test account enablement succeeded',
        ALEXA_RELEASE_EVIDENCE_LINKING: 'linked: account linking roundtrip succeeded',
        ALEXA_RELEASE_EVIDENCE_RUNTIME_INVOKE: 'failed: readiness intent returned generic fallback',
      }),
      manifestPath: workspace.manifestPath,
      readTextFile: (fileUrl: URL): Promise<string> => readFile(fileUrl, 'utf8'),
      stat: (fileUrl: URL): Promise<void> => stat(fileUrl).then((): void => undefined),
    });

    expect(summary.evidence.delivery).toBe('failed: Amazon timeout during proactive event smoke');
    expect(summary.evidence.runtimeInvoke).toBe('failed: readiness intent returned generic fallback');
  });
});
