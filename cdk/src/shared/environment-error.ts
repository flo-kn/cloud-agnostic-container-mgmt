export function environmentError(environmentValueName: string) {
  return `${environmentValueName} missing from environment. Is it set in Github Action and as a Github Secret?`;
}
