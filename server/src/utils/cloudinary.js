import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

let configured = false;

const ensureConfigured = () => {
    if (!configured) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        configured = true;
    }
};

/**
 * Upload a file to Cloudinary and delete the local temp file.
 * @param {string} localFilePath - Path to the local file
 * @param {string} resourceType - "image" | "raw" (for PDFs)
 * @returns {Promise<object|null>} Cloudinary upload result or null
 */
export const uploadOnCloudinary = async (localFilePath, resourceType = "image") => {
    try {
        if (!localFilePath) return null;
        ensureConfigured();

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: resourceType,
            folder: "lib-ai",
            access_mode: "public",
        });

        // Remove local temp file after upload
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        // Remove local temp file on failure too
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.error("Cloudinary upload error:", error.message);
        return null;
    }
};

/**
 * Generate a signed URL for a Cloudinary resource (bypasses access restrictions).
 * @param {string} publicId - Cloudinary public_id
 * @param {string} resourceType - "image" | "raw"
 * @returns {string} Signed URL
 */
export const getSignedUrl = (publicId, resourceType = "raw") => {
    ensureConfigured();
    return cloudinary.url(publicId, {
        resource_type: resourceType,
        type: "upload",
        sign_url: true,
        secure: true,
    });
};
