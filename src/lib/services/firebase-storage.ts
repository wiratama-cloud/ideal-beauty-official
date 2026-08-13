import { firebaseAdminStorage } from '../firebase/admin';
import { getDownloadURL } from 'firebase-admin/storage';

export async function uploadFileToFirebase(buffer: Buffer, fileName: string, folder: string = 'uploads', contentType: string = 'image/jpeg') {
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!firebaseAdminStorage || !bucketName) {
    throw new Error('Firebase Storage not configured');
  }

  const bucket = firebaseAdminStorage.bucket(bucketName);
  const file = bucket.file(`${folder}/${fileName}`);

  await file.save(buffer, {
    metadata: {
      contentType,
    },
  });

  const downloadUrl = await getDownloadURL(file);
  return downloadUrl;
}

export async function deleteFileFromFirebase(fileName: string, folder: string = 'uploads') {
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!firebaseAdminStorage || !bucketName) {
    throw new Error('Firebase Storage not configured');
  }

  const bucket = firebaseAdminStorage.bucket(bucketName);
  const file = bucket.file(`${folder}/${fileName}`);
  
  await file.delete();
}
