import { verifyToken } from "../middlewares/AuthMiddleware.js";
import { getMessages, uploadFile, uploadVoiceMessage, clearConversation } from "../controllers/MessagesController.js";
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const messagesRoutes = Router();
const upload = multer({ dest: "uploads/files" });

const storageVoice = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/voices";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  }
});
const uploadVoice = multer({ storage: storageVoice });

messagesRoutes.post("/get-messages", verifyToken, getMessages);
messagesRoutes.post(
  "/upload-file",
  verifyToken,
  upload.single("file"),
  uploadFile
);
messagesRoutes.post(
  "/upload-voice",
  verifyToken,
  uploadVoice.single("voice"),
  uploadVoiceMessage
);
messagesRoutes.post("/clear-conversation", verifyToken, clearConversation);

export default messagesRoutes;
