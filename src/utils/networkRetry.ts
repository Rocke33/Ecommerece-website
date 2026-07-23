/**
 * Safely executes a database operation with exponential backoff retries.
 */
export async function fetchWithRetry<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    // Exponentially backoff wait timing: 1s -> 2s -> 4s
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(operation, retries - 1, delay * 2);
  }
}