import { Request, Response } from "express";
import * as dotenv from "dotenv";

dotenv.config();

// Validation
import joi, { ObjectSchema, ValidationResult } from "joi";
import { buildJoiError } from "../utils/errors.utils";

// Database
const pb = require("../db");

export type Channel = {
  id: string;
  name: string;
  owner: string; // User ID
  server: string; // Server ID
  avatar: string;
  created: Date;
  updated: Date;
};

// Create channel, only by the server owner
export const createChannel = async (req: Request, res: Response) => {
  const payload: Object = req.body;
  const serverId: string = req.params.id;
  const schema: ObjectSchema = joi
    .object({
      name: joi.string().min(2).max(50).required(),
    })
    .options({ abortEarly: false });

  // Validate user's informations with Joi
  const dataValidated: ValidationResult = schema.validate(payload);

  // Manage validation errors
  if (dataValidated.error) {
    const error: Record<string, any> = buildJoiError(
      dataValidated.error.details
    );
    return res.status(400).json({ error: error });
  }

  // Add default values to the validated data
  dataValidated.value.owner = req.app.locals.user.id;
  dataValidated.value.server = serverId;

  try {
    // Get the server
    const server = await pb.collection("servers").getOne(serverId);

    // Check if the user is the owner of the server
    if (server.owner !== req.app.locals.user.id) {
      return res.status(403).json({
        error: "You are not the owner of this server",
      });
    }

    // Create the channel
    const channel = await pb.collection("channels").create(dataValidated.value);

    return res.status(201).json(channel);
  } catch (err) {
    return res.status(400).json({ error: err });
  }
};

// Update a channel, only by the owner
export const updateChannel = async (req: Request, res: Response) => {
  const payload: Object = req.body;
  const channelId: string = req.params.id;
  const schema: ObjectSchema = joi
    .object({
      name: joi.string().min(2).max(50).required(),
    })
    .options({ abortEarly: false });

  // Validate user's informations with Joi
  const dataValidated: ValidationResult = schema.validate(payload);

  // Manage validation errors
  if (dataValidated.error) {
    const error: Record<string, any> = buildJoiError(
      dataValidated.error.details
    );
    return res.status(400).json({ error: error });
  }

  try {
    // Get the channel
    const channel = await pb.collection("channels").getOne(channelId);

    // Check if the user is the owner of the channel
    if (channel.owner !== req.app.locals.user.id) {
      return res.status(403).json({
        error: "You are not the owner of this channel",
      });
    }

    // Update the channel
    const newChannel = await pb.collection("channels").update(channelId, dataValidated.value);

    return res.status(200).json(newChannel);
  } catch (err) {
    return res.status(400).json({ error: err });
  }
}

// Delete a channel, only by the owner
export const deleteChannel = async (req: Request, res: Response) => {
  const channelId: string = req.params.id;

  try {
    // Get the channel
    const channel = await pb.collection("channels").getOne(channelId);

    // Check if the user is the owner of the channel
    if (channel.owner !== req.app.locals.user.id) {
      return res.status(403).json({
        error: "You are not the owner of this channel",
      });
    }

    // Delete the channel
    await pb.collection("channels").delete(channelId);

    return res.status(200).json(channel);
  } catch (err) {
    return res.status(400).json({ error: err });
  }
}

// List all channels of a server
export const listChannels = async (req: Request, res: Response) => {
  const serverId: string = req.params.id;

  try {
    // Get the channels
    const channels = await pb.collection("channels").getFullList({
      filter: `server="${serverId}"`
    });

    return res.status(200).json(channels);
  } catch (err) {
    return res.status(400).json({ error: err });
  }
}