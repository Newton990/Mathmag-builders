// src/services/storage.service.ts
// Private object storage (MinIO / S3-compatible).
// Files are NEVER served directly: every read goes through an API route that
// checks role/project/publication authorization, then returns a short-lived
// signed URL or streams the object.
import { Client } from 'minio';
import type { Readable } from 'node:stream';
import { config } from '../config.js';
import { logger } from '../logger.js';

let client: Client | null = null;
let bucketReady: Promise<void> | null = null;

function getClient(): Client {
  if (!client) {
    client = new Client({
      endPoint: config.MINIO_ENDPOINT,
      port: config.MINIO_PORT,
      useSSL: config.MINIO_USE_SSL,
      accessKey: config.MINIO_ROOT_USER,
      secretKey: config.MINIO_ROOT_PASSWORD,
    });
  }
  return client;
}

async function ensureBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const mc = getClient();
      const exists = await mc.bucketExists(config.MINIO_BUCKET);
      if (!exists) {
        await mc.makeBucket(config.MINIO_BUCKET);
        logger.info({ bucket: config.MINIO_BUCKET }, 'Created private object-storage bucket');
      }
    })().catch((err) => {
      bucketReady = null;
      throw err;
    });
  }
  return bucketReady;
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
  metadata: Record<string, string> = {},
): Promise<void> {
  await ensureBucket();
  await getClient().putObject(config.MINIO_BUCKET, key, body, body.length, {
    'Content-Type': contentType,
    ...metadata,
  });
}

export async function getObjectStream(key: string): Promise<Readable> {
  await ensureBucket();
  return getClient().getObject(config.MINIO_BUCKET, key);
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const stream = await getObjectStream(key);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
  }
  return Buffer.concat(chunks);
}

export async function getSignedUrl(key: string, ttlSeconds?: number): Promise<string> {
  await ensureBucket();
  return getClient().presignedGetObject(
    config.MINIO_BUCKET,
    key,
    ttlSeconds ?? config.SIGNED_URL_TTL_SECONDS,
  );
}

export async function removeObject(key: string): Promise<void> {
  await ensureBucket();
  await getClient().removeObject(config.MINIO_BUCKET, key);
}

export function buildStorageKey(parts: Array<string | number>): string {
  return parts
    .map((part) => String(part).trim())
    .filter((part) => part.length > 0)
    .map((part) => part.replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''))
    .join('/');
}
