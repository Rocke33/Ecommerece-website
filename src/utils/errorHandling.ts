interface PostgrestErrorLike {
  message: string;
  details?: string;
  code?: string;
}

/**
 * Type guard to safely parse unknown errors into readable string logs.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  
  if (typeof error === 'object' && error !== null) {
    const candidate = error as PostgrestErrorLike;
    if (typeof candidate.message === 'string') {
      return candidate.message;
    }
  }
  
  return String(error);
}