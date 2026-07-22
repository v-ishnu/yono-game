import express from "express";
import {
  getGames,
  getGame,
  deleteGame,
} from "../controller/game.controller.js";
import createGame from "../controller/createGame.js"

import {signupAdmin, loginAdmin, listAdmins, deleteAdmin} from "../controller/admin.controller.js"
import updateGame from "../controller/updateGame.js";

import { createContact, updateContact } from "../controller/contact.controller.js";

import { upload } from "../config/cloudinary.config.js";
import { getMedia, uploadMedia, updateMediaSeo, deleteMedia } from "../controller/media.controller.js";

const router = express.Router();

router.get("/get-all-game", getGames);

// Media management routes
router.get("/media", getMedia);
router.post("/media", upload.single("file"), uploadMedia);
router.patch("/media/:id", updateMediaSeo);
router.delete("/media/:id", deleteMedia);

router.get("/:slug", getGame);
router.post("/create-game", upload.single("logo"), createGame);
router.patch("/update-game", upload.single("logo"), updateGame);
router.delete("/delete-game/:id", deleteGame);

router.post("/contact", createContact);
router.patch("/update-contact", updateContact);

router.post("/signup", signupAdmin);
router.post("/login", loginAdmin);
router.get("/admin/list", listAdmins);
router.delete("/admin/:id", deleteAdmin);

export default router;