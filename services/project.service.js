import mongoose from "mongoose";
import ProjectModel from "../models/project.model.js";

export const createProject = async ({ name, userId }) => {
  if (!name || !userId) {
    throw new Error("Name and userId are required");
  }

  let project;
  try {
    project = await ProjectModel.create({
      name,
      users: [userId],
    });
  } catch (error) {
    if (error.code == 11000) {
      throw new Error("Project name already exists");
    }
    throw error;
  }

  return project;
};

export const getAllProjectByUserId = async ({ userId }) => {
  if (!userId) {
    throw new Error("UserId is required");
  }
  const allUserProjects = await ProjectModel.find({
    users: userId,
  });
  return allUserProjects;
};

export const addUsersToProject = async ({ projectId, users, userId }) => {
  if (!projectId) {
    throw new Error("Project Id is required");
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid project Id");
  }
  if (!users) {
    throw new Error("users are required");
  }
  if (
    !Array.isArray(users) ||
    users.some((userId) => !mongoose.Types.ObjectId.isValid(userId))
  ) {
    throw new Error("Invalid userId(s) in users array");
  }

  if (!userId) {
    throw new Error("UserId is required");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }

  const project = await ProjectModel.findOne({
    _id: projectId,
    users: userId,
  });

  if (!project) {
    throw new Error("User not belong to this project");
  }

  const updatedProject = await ProjectModel.findOneAndUpdate(
    {
      _id: projectId,
    },
    {
      $addToSet: {
        users: {
          $each: users,
        },
      },
    },
    {
      new: true,
    }
  ).populate("users");

  return updatedProject;
};

export const getProjectById = async ({ projectId }) => {
  if (!projectId) {
    throw new Error("Project Id is required");
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid project Id");
  }

  const project = await ProjectModel.findOne({
    _id: projectId,
  }).populate("users");
  return project;
};
export const deleteProjectById = async ({ projectId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid Project ID");
  }

  const project = await ProjectModel.findById(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  if (!project.users.includes(userId)) {
    throw new Error("You are not a member of this project");
  }

  // Remove the user from the project
  project.users = project.users.filter((id) => id.toString() !== userId.toString());

  if (project.users.length === 0) {
    // No users left, delete the whole project
    await ProjectModel.findByIdAndDelete(projectId);
  } else {
    // Just update the project without the user
    await project.save();
  }
};

