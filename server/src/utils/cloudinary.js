import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


const uploadOnCloudinary = async (localFilePath, resourceType = "image") => {
    if (!localFilePath) return null;

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: resourceType,
            folder: "lib-ai",
        });
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        console.error("Cloudinary upload error:", error.message);
        return null;
    }
};

const deleteFromCloudinary = async (cloudinaryUrl, resourceType = "image") => {
    if (!cloudinaryUrl) return null;

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    try {
        // Extract public_id from URL: ...upload/v1234567890/lib-ai/filename.ext
        const parts = cloudinaryUrl.split("/upload/");
        if (parts.length < 2) return null;

        // Remove version prefix (v1234...) and file extension
        const pathAfterUpload = parts[1].split("/").slice(1).join("/"); // skip "v123..."
        const publicId = pathAfterUpload.replace(/\.[^/.]+$/, ""); // remove extension

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        return result;
    } catch (error) {
        console.error("Cloudinary delete error:", error.message);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
