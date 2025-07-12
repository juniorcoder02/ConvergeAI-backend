import { validationResult } from "express-validator";
import * as projectInviteService from "../services/projectInvite.service.js";

// Send Invite(s)
export const sendInvite = async (req, res) => {
  try {
    const { projectId, receiverIds } = req.body;

    if (!Array.isArray(receiverIds)) {
      return res.status(400).json({ error: "receiverIds must be an array" });
    }

    const sender = req.user;

    const invites = await projectInviteService.sendInvites({
      projectId,
      senderId: sender._id,
      receiverIds,
    });

    res.status(201).json({ invites });
  } catch (err) {
    console.error("Send Invite Error:", err.message);
    res.status(400).json({ error: err.message });
  }
};

// Get all invites for logged-in user
export const getMyInvites = async (req, res) => {
  try {
    const invites = await projectInviteService.getInvitesForUser(req.user._id);
    res.status(200).json({ invites });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Accept or Reject invite
export const respondToInvite = async (req, res) => {
  const { inviteId } = req.params;
  const { response } = req.body;
  const userId = req.user._id;

  try {
    const updatedInvite = await projectInviteService.respondToInvite({
      inviteId,
      response,
      userId,
    });

    res.status(200).json({ invite: updatedInvite });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
