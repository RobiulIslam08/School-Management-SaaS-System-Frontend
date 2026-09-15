export function requestUrl(args: string | { url: string }): string {
  return typeof args === "string" ? args : args.url;
}

export function shouldSkipSessionRefresh(url: string): boolean {
  return /\/auth\/(login|refresh|2fa|logout|forgot-password|reset-password)|\/owner\/(login|forgot-password|reset-password)/.test(
    url
  );
}
