const { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, CreateBucketCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
  },
  endpoint: process.env.MINIO_ENDPOINT || 'http://minio:9000',
  forcePathStyle: true,
});

const s3PresignClient = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
  },
  endpoint: process.env.MINIO_PUBLIC_URL || 'http://localhost:9000',
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'conta-comigo-comprovantes';

class StorageService {
  async initBucket() {
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        console.log(`Bucket ${BUCKET_NAME} não encontrado. Criando...`);
        try {
          await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
          console.log(`✓ Bucket ${BUCKET_NAME} criado com sucesso.`);
        } catch (createErr) {
          console.warn('Aviso ao criar bucket MinIO:', createErr.message);
        }
      } else {
        console.warn('Aviso ao verificar bucket MinIO:', error.message);
      }
    }
  }

  async uploadComprovante(fileBuffer, mimetype, originalName, userId) {
    const extension = originalName ? originalName.split('.').pop() : 'png';
    const fileName = `comprovantes/${userId}/comp-${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimetype,
      })
    );

    return fileName;
  }

  async uploadFotoPerfil(fileBuffer, mimetype, originalName, userId) {
    const extension = originalName ? originalName.split('.').pop() : 'jpg';
    const fileName = `perfis/${userId}/foto-${Date.now()}.${extension}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimetype,
      })
    );

    return fileName;
  }

  async getFileUrl(fileName) {
    if (!fileName) return null;

    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
      });

      return await getSignedUrl(s3PresignClient, command, { expiresIn: 7200 }); // 2 horas
    } catch (error) {
      console.error('Erro ao gerar URL presign MinIO:', error.message);
      return null;
    }
  }

  async getFileStream(fileName) {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });
    return await s3Client.send(command);
  }
}

const storageService = new StorageService();
storageService.initBucket();

module.exports = storageService;
