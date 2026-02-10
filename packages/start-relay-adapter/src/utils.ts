export const coerceError = (maybeError: unknown): Error => {
  if (maybeError instanceof Error) return maybeError;
  if (typeof maybeError === 'string') return new Error(maybeError);
  return new Error(JSON.stringify(maybeError));
};
