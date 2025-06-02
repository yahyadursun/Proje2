import { Router } from "express";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import {
  getAllConstacts,
  getContactsForDmList,
  searchContancts,
} from "../controllers/ContactsController.js";
import { getAllUsers } from "../controllers/AuthController.js";
const contactsRoutes = Router();

contactsRoutes.post("/search", verifyToken, searchContancts);
contactsRoutes.get("/get-contacts-for-dm", verifyToken, getContactsForDmList);
contactsRoutes.get("/get-all-contacts", verifyToken, getAllConstacts);
contactsRoutes.get("/get-all-users", verifyToken, getAllUsers);
export default contactsRoutes;
