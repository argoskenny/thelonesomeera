import dns from "node:dns/promises";
import net from "node:net";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

export type UploadFileMetadata = {
  name: string;
  type: string;
  size: number;
};

export type SafeUploadMetadata = {
  contentType: string;
  extension: string;
};

function normalizeContentType(contentType: string | null | undefined) {
  return contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
}

export function getImageExtension(contentType: string) {
  return ALLOWED_IMAGE_TYPES.get(normalizeContentType(contentType));
}

export function getSafeUploadMetadata(file: UploadFileMetadata): SafeUploadMetadata {
  const contentType = normalizeContentType(file.type);
  const extension = getImageExtension(contentType);

  if (!extension) {
    throw new Error("不支援的圖片格式");
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    throw new Error("圖片檔案不可為空");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`圖片不可超過 ${MAX_IMAGE_BYTES / 1024 / 1024}MB`);
  }

  return { contentType, extension };
}

export function assertImageSignature(buffer: Buffer, contentType: string) {
  const normalized = normalizeContentType(contentType);
  const isPng =
    normalized === "image/png" &&
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  const isJpeg =
    normalized === "image/jpeg" &&
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;
  const isGif =
    normalized === "image/gif" &&
    (buffer.subarray(0, 6).toString("ascii") === "GIF87a" ||
      buffer.subarray(0, 6).toString("ascii") === "GIF89a");
  const isWebp =
    normalized === "image/webp" &&
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";

  if (!isPng && !isJpeg && !isGif && !isWebp) {
    throw new Error("圖片內容與格式不符");
  }
}

export function isPrivateIpAddress(address: string) {
  const ipVersion = net.isIP(address);
  if (ipVersion === 4) {
    const [first, second] = address.split(".").map(Number);
    return (
      first === 10 ||
      first === 127 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 169 && second === 254) ||
      first === 0
    );
  }

  if (ipVersion === 6) {
    const normalized = address.toLowerCase();
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    );
  }

  return false;
}

export function parseSafeRemoteImageUrl(imageUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    throw new Error("圖片 URL 格式不正確");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("圖片 URL 必須使用 HTTP 或 HTTPS");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    isPrivateIpAddress(hostname)
  ) {
    throw new Error("圖片 URL 不可指向本機或內部網路");
  }

  return parsed;
}

export async function assertPublicRemoteImageTarget(parsed: URL) {
  const addresses = await dns.lookup(parsed.hostname, { all: true });
  if (addresses.some((address) => isPrivateIpAddress(address.address))) {
    throw new Error("圖片 URL 不可指向本機或內部網路");
  }
}
