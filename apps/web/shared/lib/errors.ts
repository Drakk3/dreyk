export class AppError extends Error {
  public readonly cause: unknown;
  public readonly context: string;

  public constructor(message: string, context: string, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.context = context;
    this.cause = cause;
  }
}

export function handleError(error: unknown, context: string): void {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`[${context}]`, message, error);
}
