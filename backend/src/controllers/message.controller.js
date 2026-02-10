import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error("Error in getUsersForSidebar:", error.message);
        res.status(500).json({ error: "Internal Server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userTochatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userTochatId },
                { senderId: userTochatId, receiverId: myId }
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);

    } catch (error) {
        console.error("Error in getMessages:", error.message);
        res.status(500).json({ error: "Internal Server error" });
    }
};

export const sendMessages = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        console.log("📤 Send Message Request:");
        console.log("- Sender ID:", senderId);
        console.log("- Receiver ID:", receiverId);
        console.log("- Has text:", !!text);
        console.log("- Has image:", !!image);

        // Validate that message has content
        if (!text && !image) {
            return res.status(400).json({ message: "Message cannot be empty" });
        }

        let imageUrl = null;

        // Upload image if present
        if (image) {
            try {
                console.log("🖼️ Starting image upload to Cloudinary...");
                
                // Check Cloudinary config
                if (!process.env.CLOUDINARY_CLOUD_NAME || 
                    !process.env.CLOUDINARY_API_KEY || 
                    !process.env.CLOUDINARY_API_SECRET) {
                    console.error("❌ Cloudinary credentials missing in .env");
                    return res.status(500).json({ 
                        message: "Server configuration error: Cloudinary credentials not set"
                    });
                }

                // Validate image format
                if (typeof image !== 'string') {
                    console.error("❌ Image is not a string:", typeof image);
                    return res.status(400).json({ 
                        message: "Invalid image format: must be a string" 
                    });
                }

                // Check if it's base64
                const isBase64 = image.startsWith('data:image/') || image.startsWith('data:application/octet-stream');
                
                if (!isBase64) {
                    console.error("❌ Image doesn't start with data:image/");
                    console.error("First 100 chars:", image.substring(0, 100));
                    return res.status(400).json({ 
                        message: "Invalid image format: must be base64 encoded with data URI (data:image/...)" 
                    });
                }

                console.log("✓ Image format validated");
                console.log("✓ Image size:", (image.length / 1024).toFixed(2), "KB");

                // Upload to Cloudinary with detailed options
                const uploadResponse = await cloudinary.uploader.upload(image, {
                    folder: "chat_images",
                    resource_type: "auto",
                    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
                    transformation: [
                        { width: 800, height: 800, crop: "limit", quality: "auto" }
                    ]
                });

                imageUrl = uploadResponse.secure_url;
                console.log("✅ Image uploaded successfully");
                console.log("- URL:", imageUrl);
                console.log("- Format:", uploadResponse.format);
                console.log("- Size:", uploadResponse.bytes, "bytes");

            } catch (uploadError) {
                console.error("❌ Cloudinary upload error:");
                console.error("- Error name:", uploadError.name);
                console.error("- Error message:", uploadError.message);
                console.error("- HTTP code:", uploadError.http_code);
                
                // Detailed error response
                let errorMessage = "Failed to upload image";
                
                if (uploadError.message.includes('Invalid image file')) {
                    errorMessage = "Invalid image file. Please upload a valid image (JPG, PNG, GIF, WEBP)";
                } else if (uploadError.message.includes('File size too large')) {
                    errorMessage = "Image file is too large. Maximum size is 10MB";
                } else if (uploadError.http_code === 401) {
                    errorMessage = "Cloudinary authentication failed. Check your API credentials";
                } else if (uploadError.http_code === 420) {
                    errorMessage = "Cloudinary rate limit exceeded. Please try again later";
                }
                
                return res.status(500).json({ 
                    message: errorMessage,
                    error: uploadError.message,
                    details: process.env.NODE_ENV === 'development' ? uploadError : undefined
                });
            }
        }

        // Create message in database
        console.log("💾 Saving message to database...");
        const newMessage = new Message({
            senderId,
            receiverId,
            text: text || "",
            image: imageUrl
        });

        await newMessage.save();
        console.log("✅ Message saved:", newMessage._id);

        // Emit to receiver via socket
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
            console.log("📨 Sent to receiver socket");
        } else {
            console.log("⚠️ Receiver offline");
        }

        // Emit to sender via socket (for multi-device sync)
        const senderSocketId = getReceiverSocketId(senderId.toString());
        if (senderSocketId) {
            io.to(senderSocketId).emit("newMessage", newMessage);
            console.log("📨 Sent to sender socket");
        }

        res.status(201).json(newMessage);

    } catch (error) {
        console.error("❌ Error in sendMessages:");
        console.error("- Message:", error.message);
        console.error("- Stack:", error.stack);
        
        res.status(500).json({ 
            message: "Internal Server Error",
            error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
        });
    }
};