import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3'

export const RUSTFS_BUCKET = process.env.RUSTFS_BUCKET || 'e-learning-msc'

const endpoint = process.env.RUSTFS_ENDPOINT || 'http://localhost:9000'
const accessKey = process.env.RUSTFS_ACCESS_KEY || 'elearningfsadmin'
const secretKey = process.env.RUSTFS_SECRET_KEY || 'elearningfsadmin-secret'
const region = process.env.RUSTFS_REGION || 'us-east-1'

let client: S3Client | undefined

export function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    })
  }
  return client
}

let bucketReady: Promise<void> | null = null

/** Ensures the RustFS bucket exists before the first upload. */
export function ensureBucketReady(): Promise<void> {
  if (!bucketReady) {
    bucketReady = ensureBucket().catch((err) => {
      bucketReady = null
      throw err
    })
  }
  return bucketReady
}

async function ensureBucket(): Promise<void> {
  const s3 = getClient()
  try {
    await s3.send(new HeadBucketCommand({ Bucket: RUSTFS_BUCKET }))
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: RUSTFS_BUCKET }))
  }
}

/**
 * Upload a buffer to RustFS. Returns a same-origin `/uploads/<folder>/<name>`
 * URL that `app/uploads/[...path]/route.ts` streams back to the browser.
 */
export async function uploadObject(params: {
  folder: string
  name: string
  body: Buffer
  contentType: string
}): Promise<string> {
  const s3 = getClient()
  await ensureBucketReady()
  const key = `uploads/${params.folder}/${params.name}`
  await s3.send(
    new PutObjectCommand({
      Bucket: RUSTFS_BUCKET,
      Key: key,
      Body: params.body,
      ContentType: params.contentType,
    })
  )
  return `/uploads/${params.folder}/${params.name}`
}

export async function getObject(key: string) {
  const s3 = getClient()
  return s3.send(new GetObjectCommand({ Bucket: RUSTFS_BUCKET, Key: key }))
}