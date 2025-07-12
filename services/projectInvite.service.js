import ProjectInviteModel from "../models/projectInvite.model.js";
import ProjectModel from "../models/project.model.js";
import mongoose from "mongoose";

// Send Invite
export const sendInvites = async ({ projectId, senderId, receiverIds }) => {
  if (!Array.isArray(receiverIds) || receiverIds.length === 0) {
    throw new Error("receiverIds must be a non-empty array");
  }

  const project = await ProjectModel.findById(projectId).populate(
    "users",
    "_id"
  );

  if (!project) {
    throw new Error("Project not found");
  }

  const projectUserIds = new Set(project.users.map((u) => u._id.toString()));

  const existingInvites = await ProjectInviteModel.find({
    project: projectId,
    receiver: { $in: receiverIds },
    status: "pending",
  });

  const alreadyInvitedUserIds = new Set(
    existingInvites.map((i) => i.receiver.toString())
  );

  const filteredReceiverIds = receiverIds.filter(
    (id) => !projectUserIds.has(id) && !alreadyInvitedUserIds.has(id)
  );

  if (filteredReceiverIds.length === 0) {
    throw new Error(
      "All selected users are already in the project or already invited."
    );
  }

  const invites = await Promise.all(
    filteredReceiverIds.map((receiverId) =>
      ProjectInviteModel.create({
        project: projectId,
        sender: senderId,
        receiver: receiverId,
        status: "pending",
      })
    )
  );

  return invites;
};

// Get all invites for logged-in user
export const getInvitesForUser = async (userId) => {
  return await ProjectInviteModel.find({
    receiver: userId,
    status: "pending",
  }).populate("project sender");
};

// Accept or reject invite
export const respondToInvite = async ({ inviteId, response, userId }) => {
  const invite = await ProjectInviteModel.findById(inviteId);
  if (!invite) throw new Error("Invite not found");
  if (!invite.receiver.equals(userId)) throw new Error("Unauthorized access");

  if (invite.status !== "pending") {
    throw new Error("Invite already responded to");
  }

  invite.status = response;
  await invite.save();

  if (response === "accepted") {
    await ProjectModel.findByIdAndUpdate(invite.project, {
      $addToSet: { users: userId },
    });
  }

  return invite;
};
