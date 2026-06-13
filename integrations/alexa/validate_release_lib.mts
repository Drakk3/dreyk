export interface AlexaSkillManifest {
  manifest: {
    accountLinking: {
      accessTokenUrl: string;
      authorizationUrl: string;
      clientId: string;
      clientSecret: string;
    };
    apis: {
      custom: {
        endpoint: {
          uri: string;
        };
      };
    };
    events: {
      endpoint: {
        uri: string;
      };
    };
    privacyAndCompliance: {
      locales: {
        'en-US': {
          privacyPolicyUrl: string;
          termsOfUseUrl: string;
        };
      };
    };
    publishingInformation: {
      locales: {
        'en-US': {
          largeIconUri: string;
          smallIconUri: string;
        };
      };
    };
  };
}

export interface ReleaseEvidence {
  delivery: string | null;
  install: string | null;
  linking: string | null;
  runtimeInvoke: string | null;
}

export interface ValidationSummary {
  checkedAt: string;
  evidence: ReleaseEvidence;
  errors: string[];
  status: 'failed' | 'passed';
}

export interface ReleaseValidationEnvironment {
  get(name: string): string | undefined;
}

export interface ReleaseValidationInput {
  env: ReleaseValidationEnvironment;
  manifestPath: URL;
  readTextFile(fileUrl: URL): Promise<string>;
  stat(fileUrl: URL): Promise<void>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readOptionalEnv(env: ReleaseValidationEnvironment, name: string): string | null {
  const value = env.get(name);

  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  return value.trim();
}

function isHttpsUrl(value: string): boolean {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

function isPlaceholderValue(value: string): boolean {
  const normalizedValue = value.toLowerCase();

  return (
    normalizedValue.includes('<') ||
    normalizedValue.includes('>') ||
    normalizedValue.includes('placeholder') ||
    normalizedValue.includes('replace_in') ||
    normalizedValue.includes('{{') ||
    normalizedValue.includes('}}')
  );
}

export function parseManifest(value: unknown): AlexaSkillManifest {
  if (isRecord(value) === false || isRecord(value.manifest) === false) {
    throw new Error('Alexa manifest must contain a manifest object.');
  }

  const { manifest } = value;

  if (
    isRecord(manifest.accountLinking) === false ||
    isRecord(manifest.apis) === false ||
    isRecord(manifest.events) === false ||
    isRecord(manifest.privacyAndCompliance) === false ||
    isRecord(manifest.publishingInformation) === false
  ) {
    throw new Error('Alexa manifest is missing required top-level sections.');
  }

  return value;
}

async function assertFileExists(fileUrl: URL, errors: string[], label: string, stat: (fileUrl: URL) => Promise<void>): Promise<void> {
  try {
    await stat(fileUrl);
  } catch {
    errors.push(`Missing required Alexa asset: ${label}.`);
  }
}

function validateUrl(value: string, label: string, errors: string[]): void {
  if (isHttpsUrl(value) === false) {
    errors.push(`${label} must be an HTTPS URL.`);
    return;
  }

  if (isPlaceholderValue(value)) {
    errors.push(`${label} still contains a placeholder value.`);
  }
}

function validateNonPlaceholder(value: string, label: string, errors: string[]): void {
  if (value.trim().length === 0) {
    errors.push(`${label} is required.`);
    return;
  }

  if (isPlaceholderValue(value)) {
    errors.push(`${label} still contains a placeholder value.`);
  }
}

export function readEvidence(env: ReleaseValidationEnvironment): ReleaseEvidence {
  return {
    delivery: readOptionalEnv(env, 'ALEXA_RELEASE_EVIDENCE_DELIVERY'),
    install: readOptionalEnv(env, 'ALEXA_RELEASE_EVIDENCE_INSTALL'),
    linking: readOptionalEnv(env, 'ALEXA_RELEASE_EVIDENCE_LINKING'),
    runtimeInvoke: readOptionalEnv(env, 'ALEXA_RELEASE_EVIDENCE_RUNTIME_INVOKE'),
  };
}

export function validateEvidence(evidence: ReleaseEvidence, errors: string[]): void {
  if (evidence.install === null) {
    errors.push('Missing install evidence: set ALEXA_RELEASE_EVIDENCE_INSTALL.');
  }

  if (evidence.linking === null) {
    errors.push('Missing account-linking evidence: set ALEXA_RELEASE_EVIDENCE_LINKING.');
  }

  if (evidence.runtimeInvoke === null) {
    errors.push('Missing runtime invocation evidence: set ALEXA_RELEASE_EVIDENCE_RUNTIME_INVOKE.');
  }

  if (evidence.delivery === null) {
    errors.push('Missing delivery evidence: set ALEXA_RELEASE_EVIDENCE_DELIVERY.');
  }
}

export async function validateReleaseManifest(input: ReleaseValidationInput): Promise<ValidationSummary> {
  const manifestText = await input.readTextFile(input.manifestPath);
  const manifest = parseManifest(JSON.parse(manifestText));
  const errors: string[] = [];

  validateUrl(manifest.manifest.apis.custom.endpoint.uri, 'Custom skill endpoint', errors);
  validateUrl(manifest.manifest.events.endpoint.uri, 'Events endpoint', errors);
  validateUrl(manifest.manifest.accountLinking.authorizationUrl, 'Authorization URL', errors);
  validateUrl(manifest.manifest.accountLinking.accessTokenUrl, 'Access token URL', errors);
  validateNonPlaceholder(manifest.manifest.accountLinking.clientId, 'Account-linking clientId', errors);
  validateUrl(
    manifest.manifest.privacyAndCompliance.locales['en-US'].privacyPolicyUrl,
    'Privacy policy URL',
    errors,
  );
  validateUrl(
    manifest.manifest.privacyAndCompliance.locales['en-US'].termsOfUseUrl,
    'Terms of use URL',
    errors,
  );

  if (manifest.manifest.apis.custom.endpoint.uri.includes('/alexa-skill-runtime') === false) {
    errors.push('Custom skill endpoint must point at alexa-skill-runtime.');
  }

  if (manifest.manifest.events.endpoint.uri.includes('/alexa-skill-webhook') === false) {
    errors.push('Events endpoint must stay on alexa-skill-webhook.');
  }

  if (manifest.manifest.accountLinking.clientSecret !== 'ALEXA_ACCOUNT_LINKING_CLIENT_SECRET_FROM_SECRET_STORE') {
    errors.push('Account-linking clientSecret must stay redacted in git as ALEXA_ACCOUNT_LINKING_CLIENT_SECRET_FROM_SECRET_STORE.');
  }

  await assertFileExists(
    new URL(manifest.manifest.publishingInformation.locales['en-US'].smallIconUri.replace('file://', './'), input.manifestPath),
    errors,
    manifest.manifest.publishingInformation.locales['en-US'].smallIconUri,
    input.stat,
  );
  await assertFileExists(
    new URL(manifest.manifest.publishingInformation.locales['en-US'].largeIconUri.replace('file://', './'), input.manifestPath),
    errors,
    manifest.manifest.publishingInformation.locales['en-US'].largeIconUri,
    input.stat,
  );

  const evidence = readEvidence(input.env);
  validateEvidence(evidence, errors);

  return {
    checkedAt: new Date().toISOString(),
    evidence,
    errors,
    status: errors.length === 0 ? 'passed' : 'failed',
  };
}
