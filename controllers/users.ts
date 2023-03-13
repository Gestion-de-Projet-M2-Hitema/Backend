import { Request, Response } from "express";
import * as dotenv from "dotenv";

dotenv.config();

// Validation
import joi, { ObjectSchema, ValidationResult } from "joi";

// JWT + dotenv + check for the presence of an environment variable
import jwt from "jsonwebtoken";

// Database
const pb = require("../db");

export const register = async (req: Request, res: Response) => {
  const payload: Object = req.body;
  const schema: ObjectSchema = joi.object({
    username: joi.string().min(2).max(50).required(),
    email: joi.string().max(255).required().email(),
    password: joi.string().min(6).max(72).required(),
    passwordConfirm: joi.string().min(6).max(72).required(),
    name: joi.string().min(2).max(50).required(),
  });

  // Validate user's informations with Joi
  const dataValidated: ValidationResult = schema.validate(payload);

  // Manage validation errors
  if (dataValidated.error) {
    const error: Record<string, any> = {};

    const path: string | number = dataValidated.error.details[0].path[0];
    const message: string = dataValidated.error.details[0].message
      .replace('"' + path.toString() + '"', "")
      .trim();

    error[path] = message;

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
        error.username = "Le nom d'utilisateur est déjà utilisé";
      }
      if (err.data.data.email) {
        error.email = "L'email est déjà utilisé";
      }
      if (err.data.data.passwordConfirm) {
        error.passwordConfirm = "Les mots de passe de correspondent pas";
      }
    }
    res.status(400).json({ error: error });
    return;
  }
};
