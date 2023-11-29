import { Storage } from '@google-cloud/storage';
import { Buffer } from 'buffer';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();
 
const bucketName = process.env.bucketName;
const gcpPrivateKey = process.env.privateKey;

// Assuming `privateKey` is a base64-encoded JSON string
const decodedPrivateKey = Buffer.from(gcpPrivateKey, 'base64').toString('utf-8');
const gcpAccessKey = JSON.parse(decodedPrivateKey);

const cloudStorage = (localFilePath, destinationPath) => {
  return new Promise(async (resolve, reject) => {
    try {
          const storage = new Storage({
            projectId: gcpAccessKey.project_id,
            credentials: gcpAccessKey,
          });

          const bucket = storage.bucket(bucketName);
          const file = bucket.file(destinationPath);

          const writeStream = file.createWriteStream({
            metadata: {
              contentType: 'application/zip',
            },
            force: true,
          });

          const readStream = fs.createReadStream(localFilePath);
          readStream.pipe(writeStream);

          writeStream.on('error', (err) => {
            console.error(`Error uploading file: ${err}`);
            reject(err);
          });

          writeStream.on('finish', async () => {
            console.log(`File uploaded successfully to ${bucketName}/${destinationPath}`);
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 7); // Set expiration to 7 days from now
            const [url] = await file.getSignedUrl({
              action: 'read',
              expires: expirationDate.getTime(),
            });

            //console.log(`Authenticated URL for file (valid for 7 days): ${url}`);
            
            // Resolve the promise with the signed URL
            resolve(url);
          });

          readStream.on('error', (err) => {
            console.error(`Error reading file: ${err}`);
            reject(err);
          });
    } 
    catch (error) {
      console.error(`Error in cloudStorage: ${error}`);
      reject(error);
    }
  });
};

export default cloudStorage;
