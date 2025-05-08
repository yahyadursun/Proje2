import { Router } from "express";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import { searchContancts } from "../controllers/ContactsController.js";
const contactsRoutes = Router();

contactsRoutes.post("/search",verifyToken,searchContancts)
export default contactsRoutes