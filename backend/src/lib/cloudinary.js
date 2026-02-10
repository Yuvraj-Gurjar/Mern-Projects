import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// Make sure dotenv is loaded
dotenv.config();

// ✅ FIXED: Properly configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Add validation to check if credentials are loaded
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error("❌ Cloudinary configuration error:");
  console.error(`   Cloud Name: ${cloudName ? "✅" : "❌ MISSING"}`);
  console.error(`   API Key: ${apiKey ? "✅" : "❌ MISSING"}`);
  console.error(`   API Secret: ${apiSecret ? "✅" : "❌ MISSING"}`);
  console.error("   Please check your .env file");
} else {
  console.log("✅ Cloudinary configured successfully");
  console.log(`   Cloud Name: ${cloudName}`);
  console.log(`   API Key: ${apiKey.substring(0, 4)}...`);
}

export default cloudinary;