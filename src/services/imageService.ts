import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

export const uploadImageFromUrl = async (url: string, userId: string): Promise<string> => {
    try {
        // 1. Fetch the image blob
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch image");
        const blob = await response.blob();

        return uploadFile(blob, userId);
    } catch (error) {
        console.error("Error uploading image from URL:", error);
        throw error;
    }
};

export const uploadFile = async (file: Blob | File, userId: string): Promise<string> => {
    try {
        // 1. Generate a unique path
        const timestamp = Date.now();
        // Get extension from file type if possible, default to jpg
        const extension = file.type.split('/')[1] || 'jpg';
        const path = `users/${userId}/images/${timestamp}.${extension}`;
        const storageRef = ref(storage, path);

        // 2. Upload
        await uploadBytes(storageRef, file);

        // 3. Get Download URL
        const downloadUrl = await getDownloadURL(storageRef);
        return downloadUrl;
    } catch (error) {
        console.error("Error uploading file:", error);
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
