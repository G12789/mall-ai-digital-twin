const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

export async function safeQuery<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (DEV_MODE) {
    try {
      return await fn()
    } catch {
      return fallback
    }
  }
  return fn()
}
