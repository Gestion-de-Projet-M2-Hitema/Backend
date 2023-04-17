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

export type User = {
  id: string;
  avatar: string;
  username: string;
  email: string;
  name: string;
  emailVisibility: boolean;
  verified: boolean;
  created: Date;
  updated: Date;
};

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

export const logout = (req: Request, res: Response) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.sendStatus(200);
};

// update user's informations
export const update = async (req: Request, res: Response) => {
  const payload: Object = req.body;
  const userInfo = req.app.locals.user;

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
    await pb.collection("users").update(userInfo.id, dataValidated.value);
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
  const userInfo = req.app.locals.user;

  // check if file exist in the request
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  // check if the file is an image
  if (!req.file.mimetype.startsWith("image")) {
    res.status(400).json({ error: "File is not an image" });
    return;
  }

  // Create a FormData object to send the file to PocketBase
  let form = new FormData();

  form.append("avatar", new Blob([req.file.buffer]), req.file.originalname);

  try {
    const user = await pb.collection("users").update(userInfo.id, form);

    // Set the URL of the avatar image
    if (user.avatar) {
      user.avatar = pb.getFileUrl(user, user.avatar);
    }
    res.status(200).json({ avatar: user.avatar });
  } catch (err: any) {
    res.status(400);
    return;
  }
};

// Update user's password
export const updatePassword = async (req: Request, res: Response) => {
  const payload: Object = req.body;
  const userInfo = req.app.locals.user;

  const schema: ObjectSchema = joi
    .object({
      oldPassword: joi.string().min(6).max(72).required(),
      password: joi.string().min(6).max(72).required(),
      passwordConfirm: joi.string().min(6).max(72).required(),
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
    await pb.collection("users").update(userInfo.id, dataValidated.value);
    res.sendStatus(200);
  } catch (err: any) {
    const error: Record<string, any> = {};

    if (err.data.data) {
      if (err.data.data.passwordConfirm) {
        error.passwordConfirm = "Passwords do not match";
      }
    }
    res.status(400).json({ error: error });
    return;
  }
};

// List all users paginated
export const list = async (req: Request, res: Response) => {
  // const page: number = parseInt(req.query.page as string) || 1;
  // const limit: number = parseInt(req.query.limit as string) || 10;

  const schema: ObjectSchema = joi
    .object({
      page: joi.number().min(1).required(),
      limit: joi.number().min(1).required(),
    })
    .options({ abortEarly: false });

  // Validate user's informations with Joi
  const dataValidated: ValidationResult = schema.validate(req.query);

  // Manage validation errors
  if (dataValidated.error) {
    const error: Record<string, any> = buildJoiError(
      dataValidated.error.details
    );
    return res.status(400).json({ error: error });
  }

  const page: number = dataValidated.value.page;
  const limit: number = dataValidated.value.limit;

  // console.log(page, limit);

  try {
    const result = await pb.collection("users").getList(page, limit);

    const items = result.items.map((user: User) => {
      const avatar = user.avatar ? pb.getFileUrl(user, user.avatar) : null;
      return {
        ...user,
        avatar: avatar,
      };
    });

    const data = {
      ...result,
      items: items,
    };

    res.status(200).json(data);
    return;
  } catch (err: any) {
    res.status(400);
    return;
  }
};

// Get user's informations
export const get = async (req: Request, res: Response) => {
  const userId: string = req.params.id;

  try {
    const user = await pb.collection("users").getOne(userId);

    const avatar = user.avatar ? pb.getFileUrl(user, user.avatar) : null;

    const data = {
      ...user,
      avatar: avatar,
    };

    res.status(200).json(data);
    return;
  } catch (err: any) {
    res.status(400);
    return;
  }
};
