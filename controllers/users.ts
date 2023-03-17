import { Request, Response } from "express";
import * as dotenv from "dotenv";

dotenv.config();

// Validation
import joi, { ObjectSchema, ValidationResult } from "joi";
import { buildJoiError } from "../utils/errors.utils";

// JWT + dotenv + check for the presence of an environment variable
import jwt, { JwtPayload } from "jsonwebtoken";

// Database
const pb = require("../db");

export const register = async (req: Request, res: Response) => {
  const payload: Object = req.body;
  const schema: ObjectSchema = joi
    .object({
      username: joi.string().min(2).max(50).required(),
      email: joi.string().max(255).required().email(),
      password: joi.string().min(6).max(72).required(),
      passwordConfirm: joi.string().min(6).max(72).required(),
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
  dataValidated.value.emailVisibility = true;
  dataValidated.value.verified = true;

  try {
    const user = await pb.collection("users").create(dataValidated.value);
    const privateKey = process.env.JWT_PRIVATE_KEY;

    if (!privateKey) {
      res.sendStatus(400);
      return;
    }

    const token: string = jwt.sign({ id: user.id }, privateKey);

    res.cookie("jwt", token, { maxAge: 7 * (24 * 60 * 60 * 1000) });
    res.sendStatus(201);
  } catch (err: any) {
    const error: Record<string, any> = {};

    if (err.data.data) {
      if (err.data.data.username) {
        error.username = "Username is already used";
      }
      if (err.data.data.email) {
        error.email = "Email is already used";
      }
      if (err.data.data.passwordConfirm) {
        error.passwordConfirm = "Passwords do not match";
      }
    }
    res.status(400).json({ error: error });
    return;
  }
};

export const login = async (req: Request, res: Response) => {
  const payload: Object = req.body;
  const schema: ObjectSchema = joi
    .object({
      email: joi.string().max(255).required().email(),
      password: joi.string().min(6).max(72).required(),
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
    // Retrieve the user
    const authData = await pb
      .collection("users")
      .authWithPassword(
        dataValidated.value.email,
        dataValidated.value.password
      );
    const user: Record<string, any> = authData.record;
    const privateKey = process.env.JWT_PRIVATE_KEY;

    if (!privateKey) {
      res.sendStatus(400);
      return;
    }

    const token: string = jwt.sign({ id: user.id }, privateKey);

    // Set the URL of the avatar image
    if (user.avatar) {
      user.avatar = pb.getFileUrl(user, user.avatar);
    }

    res.cookie("jwt", token, { maxAge: 7 * (24 * 60 * 60 * 1000) });
    res
      .status(200)
      .json({ username: user.username, name: user.name, avatar: user.avatar });
  } catch (err: any) {
    res.status(400).json({ error: "Incorrect email or password" });
    return;
  }
};

// update user's informations
export const update = async (req: Request, res: Response) => {
  const payload: Object = req.body;
  const cookie: string = req.cookies.jwt;
  const privateKey = process.env.JWT_PRIVATE_KEY;

  if (!privateKey) {
    res.sendStatus(400);
    return;
  }

  // Decode the JWT token
  const decoded: JwtPayload & { id: string } = jwt.verify(cookie, privateKey) as JwtPayload & { id: string };

  const schema: ObjectSchema = joi
    .object({
      username: joi.string().min(2).max(50).required(),
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
    const user = await pb.collection("users").update(decoded.id, dataValidated.value);
    res.sendStatus(200);
  } catch (err: any) {
    const error: Record<string, any> = {};

    if (err.data.data) {
      if (err.data.data.username) {
        error.username = "Username is already used";
      }
    }
    res.status(400).json({ error: error });
    return;
  }
};

// update user's avatar
export const upload = async (req: Request, res: Response) => {
  const cookie: string = req.cookies.jwt;
  const privateKey = process.env.JWT_PRIVATE_KEY;

  // check if file exist in the request
  if (!req.file) {
    res.sendStatus(400).json({ error: "No file uploaded" });
    return;
  }

  // check if the file is an image
  if (!req.file.mimetype.startsWith("image")) {
    res.sendStatus(400).json({ error: "File is not an image" });
    return;
  }

  // Create a FormData object to send the file to PocketBase
  let form = new FormData();

  form.append("avatar", new Blob([req.file.buffer]), req.file.originalname);

  if (!privateKey) {
    res.sendStatus(400);
    return;
  }

  // Decode the JWT token
  const decoded: JwtPayload & { id: string } = jwt.verify(cookie, privateKey) as JwtPayload & { id: string };

  try {
    const user = await pb.collection("users").update(decoded.id, form);

    // Set the URL of the avatar image
    if (user.avatar) {
      user.avatar = pb.getFileUrl(user, user.avatar);
    }
    res.status(200).json({ avatar: user.avatar });
  } catch (err: any) {
    res.status(400);
    return;
  }
}
