import AWS from "aws-sdk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables from .env file
dotenv.config();

// Configure Cloudflare R2 (S3-compatible API)
const s3 = new AWS.S3({
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    signatureVersion: "v4",
    region: "auto",
});

/**
 * Middleware to handle file uploads to Cloudflare R2.
 * This function expects a file to be present in `file` (from multer.single)
 * or `files` (from express-fileupload or multer.fields).
 * It attaches `req.uploadedFileUrl` and `req.uploadMessage` for subsequent route handlers.
 */
export const r2UploadMiddleware = async (file) => {
    console.log("Inside r2UploadMiddleware", file);
    try {
        // Check if a file was actually uploaded by multer
        if (!file) {
            return "No file uploaded"
        }
        const uploadPath = `temp/${file.name}`;
        await file.mv(uploadPath);
        // Read the file content from the temporary path
        const fileContent = fs.readFileSync(uploadPath);

        // Parameters for S3 upload
        const params = {
            Bucket: process.env.CLOUDFLARE_BUCKET_NAME, // Your R2 bucket name
            Key: file?.name, // The name the file will have in R2
            Body: fileContent, // The file content
            ContentType: file?.mimetype, // The MIME type of the file
        };

        // Upload the file to R2
        const data = await s3.upload(params).promise();

        // Remove the temporary file from the local server after successful upload
        fs.unlinkSync(uploadPath);

        // Send success response with the URL of the uploaded file
        return { fileUrl: `https://pub-48d3e9677d09450a9113bb7bddbe02c8.r2.dev/${file?.name}`, }
    } catch (error) {
        console.error("File Upload Error: ", error);
    }
};
