import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { storage } from "./firebase";

export const getImageCount = async (userId: string): Promise<number> => {
    try {
        const imagesRef = ref(storage, `users/${userId}/images`);
        const result = await listAll(imagesRef);
        return result.items.length;
    } catch (error) {
        console.error("Error getting image count:", error);
        return 0;
    }
};

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

const compressImage = (file: Blob | File): Promise<Blob> => {
    return new Promise((resolve) => {
        // If not an image (or SVG), return original
        if (file.type && !file.type.startsWith('image/')) {
            return resolve(file);
        }
        if (file.type === 'image/svg+xml') {
            return resolve(file);
        }

        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Optimization: Resize if too large (e.g. > 1920px)
            const MAX_DIMENSION = 1920;
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                if (width > height) {
                    height = Math.round((height * MAX_DIMENSION) / width);
                    width = MAX_DIMENSION;
                } else {
                    width = Math.round((width * MAX_DIMENSION) / height);
                    height = MAX_DIMENSION;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                // Fallback to original if canvas fails
                console.warn("Canvas context failed, uploading original.");
                resolve(file);
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Compress to WebP
            canvas.toBlob((blob) => {
                if (blob) {
                    // Check if compressed blob is actually smaller. 
                    // If original was very optimized (e.g. tiny png), webp might be bigger?
                    // But usually for photos WebP is better. 
                    // Let's just use the WebP version to ensure uniformity as requested ("use webp format").
                    resolve(blob);
                } else {
                    console.warn("Canvas compression failed, uploading original.");
                    resolve(file);
                }
            }, 'image/webp', 0.6);
        };

        img.onerror = (error) => {
            URL.revokeObjectURL(url);
            console.warn("Image load failed for compression, uploading original.", error);
            resolve(file);
        };

        img.src = url;
    });
};

export const uploadFile = async (file: Blob | File, userId: string): Promise<string> => {
    try {
        // 1. Compress/Optimize Image
        const compressedBlob = await compressImage(file);

        // 2. Generate a unique path with .webp extension
        const timestamp = Date.now();
        // Force .webp extension for consistency as we converted it
        const extension = 'webp';
        const path = `users/${userId}/images/${timestamp}.${extension}`;
        const storageRef = ref(storage, path);

        // 3. Upload with metadata
        const metadata = {
            contentType: 'image/webp',
        };
        await uploadBytes(storageRef, compressedBlob, metadata);

        // 4. Get Download URL
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

export const downloadImage = async (url: string, filename: string) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error("Error downloading image:", error);
        // Fallback to opening in new tab
        window.open(url, '_blank');
    }
};
