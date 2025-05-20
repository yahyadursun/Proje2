import Message from "../models/MessagesModel.js";
import { mkdirSync, renameSync } from "fs";

export const getMessages = async (request, response, next) => {
  try {
    const user1 = request.userId;
    const user2 = request.body.id;
    if (!user1 || !user2) {
      return response
        .status(400)
        .json({ message: "Both user ID's are required." });
    }

    const messages = await Message.find({
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 },
      ],
    }).sort({ timestamp: 1 });

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
