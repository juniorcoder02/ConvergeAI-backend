import { Router } from "express";
import * as projectInviteController from "../controllers/projectInvite.controller.js";
import { authUser } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/send", authUser, projectInviteController.sendInvite);
router.get("/my-invites", authUser, projectInviteController.getMyInvites);
router.post("/respond/:inviteId", authUser, projectInviteController.respondToInvite);

export default router;