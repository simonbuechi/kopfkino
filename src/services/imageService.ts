import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

export const uploadImageFromUrl = async (url: string, userId: string): Promise<string> => {
    try {
        // 1. Fetch the image blob
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch image");
        const blob = await response.blob();

        // 2. Generate a unique path
        const timestamp = Date.now();
        const path = `users/${userId}/images/${timestamp}.jpg`;
        const storageRef = ref(storage, path);

        // 3. Upload
        await uploadBytes(storageRef, blob);

        // 4. Get Download URL
        const downloadUrl = await getDownloadURL(storageRef);
        return downloadUrl;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};

export const deleteImageFromUrl = async (downloadUrl: string) => {
    try {
        const storageRef = ref(storage, downloadUrl);
        await deleteObject(storageRef);
    } catch (error) {
        console.error("Error deleting image:", error);
        // Don't throw, just log. 
    }
};
