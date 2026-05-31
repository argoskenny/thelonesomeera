export const DEFAULT_ADMIN_HOSTNAME = "admin.thelonesomeera.com";

function normalizeHostname(value: string) {
  return value.trim().toLowerCase().replace(/:\d+$/, "");
}

export function getAdminHostname() {
  const configuredHostname = process.env.ADMIN_HOSTNAME;
  if (!configuredHostname) {
    return null;
  }

  const hostname = normalizeHostname(configuredHostname);
  return hostname || null;
}

export function getRequestHostname(request: Pick<Request, "headers" | "url">) {
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || request.headers.get("host") || new URL(request.url).host;
  return normalizeHostname(host);
}

export function isAdminHostRequest(request: Pick<Request, "headers" | "url">) {
  const adminHostname = getAdminHostname();
  if (!adminHostname) {
    return true;
  }

  return getRequestHostname(request) === adminHostname;
}
