import { AwsClient } from 'aws4fetch';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export function createR2Client(config: R2Config): AwsClient {
  return new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: 'auto',
    service: 's3',
  });
}

export async function getPresignedUploadUrl(
  r2Client: AwsClient,
  config: R2Config,
  key: string,
  contentType: string,
  contentLength: number,
  expirySeconds = 300
): Promise<{ url: string; publicUrl: string }> {
  const bucket = config.bucket;
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const url = new URL(`https://${host}/${bucket}/${key}`);
  
  const signed = await r2Client.sign(
    new Request(url, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(contentLength),
      },
    }),
    { aws: { signQuery: true, datetime: new Date().toISOString().replace(/[:\-]|\.[0-9]{3}/g, ''), service: 's3' } }
  );

  // Build presigned URL from signed request
  const presignedUrl = signed.url;
  
  const publicUrl = `https://${host}/${bucket}/${key}`;

  return { url: presignedUrl, publicUrl };
}

export function generateFileKey(prefix: string, originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${prefix}/${timestamp}-${random}.${ext}`;
}
