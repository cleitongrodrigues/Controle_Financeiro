const { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, CreateBucketCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
  },
  endpoint: process.env.MINIO_ENDPOINT || 'http://minio:9000',
  forcePathStyle: true, // Necessário para o MinIO
});

const s3PresignClient = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
  },
  endpoint: 'http://localhost:9000', // A URL externa que o navegador vai enxergar
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'cine-magico-profiles';

class StorageService {
  async initBucket() {
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    } catch (error) {
      if (error.name === 'NotFound') {
        console.log(`Bucket ${BUCKET_NAME} não encontrado. Criando...`);
        await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
        console.log(`Bucket ${BUCKET_NAME} criado com sucesso.`);
      } else {
        console.error('Erro ao verificar bucket no MinIO:', error);
      }
    }
  }

  async uploadFile(fileBuffer, mimetype, originalName, userId) {
    const extension = originalName.split('.').pop();
    const fileName = `users/${userId}/profile-${Date.now()}.${extension}`;

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

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    // Gera uma URL temporária válida por 1 hora usando o client de presign (com localhost)
    return await getSignedUrl(s3PresignClient, command, { expiresIn: 3600 });
  }
}

const storageService = new StorageService();
storageService.initBucket(); // Inicializa o bucket ao iniciar o servidor

module.exports = storageService;
