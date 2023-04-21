import { Request, Response } from "express";
import * as dotenv from "dotenv";

dotenv.config();

// Validation
import joi, { ObjectSchema, ValidationResult } from "joi";
import { buildJoiError } from "../utils/errors.utils";

// Database
const pb = require("../db");

export type ServerRequest = {
  id: string;
  from: string; // User ID
  to: string; // Server ID
  created: Date;
  updated: Date;
};

// Create a join server request
export const create = async (req: Request, res: Response) => {
  const payload: Object = req.body;
  const schema: ObjectSchema = joi
    .object({
      to: joi.string().required(),
    })
    .options({ abortEarly: false });

  // Validate server request informations with Joi
  const dataValidated: ValidationResult = schema.validate(payload);

  // Manage validation errors
  if (dataValidated.error) {
    const error: Record<string, any> = buildJoiError(
      dataValidated.error.details
    );
    return res.status(400).json({ error: error });
  }

  // Add default values to the validated data
  dataValidated.value.from = req.app.locals.user.id;

  try {
    const serverRequest = await pb
      .collection("server_requests")
      .create(dataValidated.value);
    return res.status(201).json(serverRequest);
  } catch (err) {
    return res.status(400).json({ error: err });
  }
};

// Accept a join server request, only the server owner can do it
export const accept = async (req: Request, res: Response) => {
  const requestId: string = req.params.id;

  try {
    // Get the server request
    const serverRequest = await pb.collection("server_requests").getOne(requestId);

    // Get the server members
    const server = await pb.collection("servers").getOne(serverRequest.to);

    // Add the user to the server
    await pb
      .collection("servers")
      .update(serverRequest.to, {
        members: [...server.members, serverRequest.from],
      });

    // Delete the server request
    await pb.collection("server_requests").delete(requestId);

    return res.status(200).json({ message: "Server request accepted" });
  } catch (err) {
    return res.status(400).json({ error: err });
  }
};


// Decline a join server request, only the server owner can do it
export const decline = async (req: Request, res: Response) => {
  const requestId: string = req.params.id;

  try {
    // Delete the server request
    await pb.collection("server_requests").delete(requestId);

    return res.status(200).json({ message: "Server request declined" });
  } catch (err) {
    return res.status(400).json({ error: err });
  }
}

// List all server requests for a server paginated, only the server owner can do it
export const list = async (req: Request, res: Response) => {
  const serverId: string = req.params.id;
  const payload: Object = req.query;

  const schema: ObjectSchema = joi
    .object({
      page: joi.number().min(1).required(),
      limit: joi.number().min(1).required(),
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

  const page: number = dataValidated.value.page;
  const limit: number = dataValidated.value.limit;

  try {
    // Get the server
    const server = await pb.collection("servers").getOne(serverId);

    // Check if the user is the server owner
    if (server.owner !== req.app.locals.user.id) {
      return res.status(403).json({ error: "You are not the owner of this server" });
    }

    // Get the server requests
    const serverRequests = await pb
      .collection("server_requests")
      .getList(page, limit, {
        filter: `to='${serverId}'`,
        expand: "from"
      });

    return res.status(200).json(serverRequests);
  }
  catch (err) {
    return res.status(400).json({ error: err });
  }
}

// Get all server requests for a user
export const get = async (req: Request, res: Response) => {
  const userId: string = req.app.locals.user.id;

  try {
    // Get the server requests
    const serverRequests = await pb
      .collection("server_requests")
      .getFullList({
        filter: `from='${userId}'`
      });

    return res.status(200).json(serverRequests);
  }
  catch (err) {
    return res.status(400).json({ error: err });
  }
}
