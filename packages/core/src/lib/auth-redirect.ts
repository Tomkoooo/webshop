/** Build login path preserving return URL after Google sign-in. */
export function authLoginPath(callbackUrl: string): string {
  const params = new URLSearchParams({ callbackUrl });
  return `/auth/login?${params.toString()}`;
}
