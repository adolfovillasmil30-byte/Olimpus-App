import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

/**
 * Uploads a compressed food photo to the user's private storage path:
 * `users/{uid}/food_photos/{imageId}.jpg`
 * 
 * Includes offline / network failure handling: if the upload fails
 * (e.g., offline mode, poor connection, or storage rules permission),
 * it safely catches the error and returns null so meal text and nutrition
 * metrics can still be saved without interruption.
 */
export async function uploadFoodPhoto(
  uid: string,
  imageId: string,
  imageBlob: Blob
): Promise<string | null> {
  if (!uid || !imageId || !imageBlob) {
    return null;
  }

  const storagePath = `users/${uid}/food_photos/${imageId}.jpg`;

  try {
    const storageRef = ref(storage, storagePath);
    const metadata = {
      contentType: imageBlob.type || 'image/jpeg',
      customMetadata: {
        userId: uid,
        uploadedAt: new Date().toISOString(),
      },
    };

    const snapshot = await uploadBytes(storageRef, imageBlob, metadata);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn(
      `No se pudo subir la foto a Firebase Storage (${storagePath}). Guardando registro offline/local:`,
      error
    );
    return null;
  }
}

/**
 * Deletes a food photo from Firebase Storage if it exists.
 */
export async function deleteFoodPhoto(uid: string, imageId: string): Promise<void> {
  if (!uid || !imageId) return;
  const storagePath = `users/${uid}/food_photos/${imageId}.jpg`;

  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error) {
    // If the image doesn't exist in Storage (e.g., uploaded offline or already deleted), ignore
    console.warn(`Aviso al eliminar foto (${storagePath}):`, error);
  }
}
