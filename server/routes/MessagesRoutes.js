import{verifyToken} from "../middlewares/AuthMiddleware.js";
import { getMessages } from "../controllers/MessagesController.js";
import { Router } from "express";


const messagesRoutes = Router();

messagesRoutes.post("/get-messages",verifyToken,getMessages); 

export default messagesRoutes;