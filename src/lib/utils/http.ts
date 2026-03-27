export function is4xxError(code?: number | undefined): boolean {
  return code !== undefined && code >= 400 && code < 500;
}
