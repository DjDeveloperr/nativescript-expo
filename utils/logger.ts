export function logError(error: unknown) {
  if (__DEV__) {
    console.error(error);
  }
}

export function logWarning(message: string) {
  if (__DEV__) {
    console.warn(message);
  }
}
