import userModel from "../models/user.model.js";
import * as userService from "../services/user.service.js";
import { validationResult } from "express-validator";
import redisClient from "../services/redis.service.js";

export const createUserController = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await userService.createUser(req.body);

    const token = await user.generateJWT();

    delete user._doc.password; // Remove password from response

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

export const loginController = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ error: "User not registered" });
    }
    const isMatch = await user.isValidPassword(password);

    if (!isMatch) {
      return res.status(401).json({ errors: "Invalid credentials" });
    }

    const token = await user.generateJWT();
    delete user._doc.password; // Remove password from response
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export const profileController = async (req, res) => {
  res.status(200).json({
    user: req.user,
  });
};

export const logoutController = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized user" });
    }

    redisClient.set(token, "logout", "EX", 60 * 60 * 24);

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export const getAllUsersController = async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({
      email: req.user.email,
    });
    const allUsers = await userService.getAllUsers(loggedInUser._id);
    return res.status(200).json({
      users: allUsers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
