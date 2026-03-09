const REQUEST_IP_HEADER_NAMES = [
  "cf-connecting-ip",
  "x-forwarded-for",
  "x-real-ip",
  "x-vercel-forwarded-for",
  "fly-client-ip",
  "true-client-ip",
  "fastly-client-ip",
  "x-client-ip",
] as const;

export const LOCAL_DEVELOPMENT_REQUEST_SOURCE = "local-development";
const REQUEST_CITY_HEADER_NAME = "x-vercel-ip-city";
const REQUEST_COUNTRY_HEADER_NAME = "x-vercel-ip-country";

function normalizeIpCandidate(rawValue: string): string | undefined {
  let value = rawValue.trim();
  if (!value) {
    return undefined;
  }

  value = value.replace(/^for=/i, "").trim();
  value = value.replace(/^"(.*)"$/, "$1").trim();

  if (value.startsWith("[")) {
    const bracketEnd = value.indexOf("]");
    if (bracketEnd > 0) {
      value = value.slice(1, bracketEnd).trim();
    }
  } else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(value)) {
    value = value.replace(/:\d+$/, "");
  }

  if (!value || value.toLowerCase() === "unknown") {
    return undefined;
  }

  if (value.startsWith("::ffff:")) {
    const mappedIp = value.slice("::ffff:".length).trim();
    if (mappedIp) {
      value = mappedIp;
    }
  }

  if (
    value === "::1" ||
    value === "0:0:0:0:0:0:0:1" ||
    value === "127.0.0.1" ||
    value === "localhost"
  ) {
    return process.env.NODE_ENV === "development"
      ? LOCAL_DEVELOPMENT_REQUEST_SOURCE
      : undefined;
  }

  return value;
}

function extractIpAddress(rawValue: string): string | undefined {
  for (const entry of rawValue.split(",")) {
    const normalizedValue = normalizeIpCandidate(entry);
    if (normalizedValue) {
      return normalizedValue;
    }
  }

  return undefined;
}

function getForwardedHeaderIp(headerStore: Headers): string | undefined {
  const forwardedHeader = headerStore.get("forwarded");
  if (!forwardedHeader) {
    return undefined;
  }

  const firstEntry = forwardedHeader.split(",")[0]?.trim();
  if (!firstEntry) {
    return undefined;
  }

  for (const segment of firstEntry.split(";")) {
    const [key, value] = segment.split("=", 2);
    if (key?.trim().toLowerCase() !== "for" || !value) {
      continue;
    }

    return extractIpAddress(value);
  }

  return undefined;
}

export function getRequestIpAddress(headerStore: Headers): string | undefined {
  for (const headerName of REQUEST_IP_HEADER_NAMES) {
    const value = headerStore.get(headerName);
    if (!value) {
      continue;
    }

    const normalizedValue = extractIpAddress(value);
    if (normalizedValue) {
      return normalizedValue;
    }
  }

  return getForwardedHeaderIp(headerStore);
}

function normalizeLocationValue(rawValue: string | null): string | undefined {
  if (!rawValue) {
    return undefined;
  }

  const value = rawValue.trim();
  return value ? value : undefined;
}

export function getRequestLocation(headerStore: Headers): {
  city?: string;
  country?: string;
} {
  const city = normalizeLocationValue(headerStore.get(REQUEST_CITY_HEADER_NAME));
  const country = normalizeLocationValue(
    headerStore.get(REQUEST_COUNTRY_HEADER_NAME),
  );

  return {
    city,
    country,
  };
}
