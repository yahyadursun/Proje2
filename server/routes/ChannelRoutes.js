import { Router } from "express";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import {
     createChannel,
     getChannelMessages,
     getUserChannels,
     updateChannel,
} from "../controllers/ChannelController.js";
import multer from "multer";
import path from "path";

const channelRoutes = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/channels/");
  },
  filename: function (req, file, cb) {
    console.log("file.originalname:", file.originalname);
    const ext = path.extname(file.originalname);
    console.log("ext:", ext);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

channelRoutes.post("/create-channel", verifyToken, upload.single("image"), createChannel);
channelRoutes.get("/get-user-channels", verifyToken, getUserChannels);
// In channelRoutes.js
channelRoutes.get("/get-channel-messages/:channelId", verifyToken, getChannelMessages);
channelRoutes.patch("/update-channel/:id", verifyToken, upload.single("image"), updateChannel);
export default channelRoutes;