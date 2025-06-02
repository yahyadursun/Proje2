import Message from "../models/MessagesModel.js";
import { mkdirSync, renameSync } from "fs";

export const getMessages = async (request, response, next) => {
  try {
    const user1 = request.userId;
    const user2 = request.body.id;
    console.log("[getMessages] user1:", user1, "user2:", user2);
    if (!user1 || !user2) {
      return response
        .status(400)
        .json({ message: "Both user ID's are required." });
    }

    const query = {
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 },
      ],
      deletedBy: { $ne: user1 },
    };
    console.log("[getMessages] Query:", JSON.stringify(query));
    const messages = await Message.find(query).sort({ timestamp: 1 });
    console.log(`[getMessages] Found ${messages.length} messages`);

    return response.status(200).json({
      messages,
    });
  } catch (error) {
    console.log({ error });
    return response.status(500).json({ message: "Internal Server Error" });
  }
};

export const uploadFile = async (request, response, next) => {
  try {
    if (!request.file) {
      return response.status(400).json({ message: "File is required." });
    }

    // Format date as YYYY-MM-DD_HH-MM-SS
    const date = new Date();
    const formattedDate = date.toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0];
    
    // Create a directory path without invalid characters
    let fileDir = `uploads/files/${formattedDate}`;

    mkdirSync(fileDir, { recursive: true });
    let fileName = `${fileDir}/${request.file.originalname}`;
    renameSync(request.file.path, fileName);

    return response.status(200).json({
      filePath: fileName,
    });
  } catch (error) {
    console.log({ error });
    return response.status(500).json({ message: "Internal Server Error" });
  }
};

export const uploadVoiceMessage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Ses dosyası yüklenemedi" });
    }
    return res.status(200).json({ fileUrl: req.file.path });
  } catch (error) {
    console.log("[uploadVoiceMessage ERROR]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const clearConversation = async (req, res) => {
  try {
    const user1 = req.userId;
    const user2 = req.body.id;
    console.log("[clearConversation] user1:", user1, "user2:", user2);
    if (!user1 || !user2) {
      return res.status(400).json({ message: "Both user ID's are required." });
    }
    const updateQuery = {
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 },
      ],
      deletedBy: { $ne: user1 },
    };
    console.log("[clearConversation] Update Query:", JSON.stringify(updateQuery));
    const updateResult = await Message.updateMany(
      updateQuery,
      { $addToSet: { deletedBy: user1 } }
    );
    console.log("[clearConversation] updateMany result:", updateResult);
    return res.status(200).json({ message: "Sohbet temizlendi." });
  } catch (error) {
    console.log("[clearConversation ERROR]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
