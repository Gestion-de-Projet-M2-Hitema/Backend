import { Request, Response } from "express";
import * as dotenv from "dotenv";

dotenv.config();

// Validation
import joi, { ObjectSchema, ValidationResult } from "joi";
import { buildJoiError } from "../utils/errors.utils";

// Database
const pb = require("../db");

export type Server = {
  id: string;
  name: string;
  owner: string; // User ID
  channels: string[]; // Channel IDs
  created: Date;
  updated: Date;
};

// Create a new server
export const create = async (req: Request, res: Response) => {
  const payload: Object = req.body;
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
  dataValidated.value.channels = [];

  try {
    const server = await pb.collection("servers").create(dataValidated.value);
    return res.status(201).json(server);
  } catch (err) {
    return res.status(400).json({ error: err });
  }
};

// Update a server, only the owner can do it
export const update = async (req: Request, res: Response) => {
  const payload: Object = req.body;
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
    // check if the server exists
    const serverBefore = await pb.collection("servers").getOne(req.params.id);
    if (!serverBefore) {
      return res.status(404).json({ error: "Server not found" });
    }

    // check if the user is the owner of the server
    if (serverBefore.owner !== req.app.locals.user.id) {
      return res
        .status(403)
        .json({ error: "You are not the owner of this server" });
    }

    const server = await pb
      .collection("servers")
      .update(req.params.id, dataValidated.value);
    return res.status(201).json(server);
  } catch (err) {
    return res.status(400).json({ error: err });
  }
};

// Delete a server, only the owner can do it
export const remove = async (req: Request, res: Response) => {
  try {
    // check if the server exists
    const serverBefore = await pb.collection("servers").getOne(req.params.id);
    if (!serverBefore) {
      return res.status(404).json({ error: "Server not found" });
    }

    // check if the user is the owner of the server
    if (serverBefore.owner !== req.app.locals.user.id) {
      return res
        .status(403)
        .json({ error: "You are not the owner of this server" });
    }
    const server = await pb.collection("servers").delete(req.params.id);
    return res.status(201).json(server);
  } catch (err) {
    return res.status(400).json({ error: err });
  }
};

// List all users paginated
export const list = async (req: Request, res: Response) => {
  const userInfo = req.app.locals.user;

  try {
    const result = await pb.collection("servers").getFullList({
      filter: `members ~ "${userInfo.id}"`,
    });

    res.status(200).json(result);
    return;
  } catch (err: any) {
    res.status(400);
    return;
  }
};
