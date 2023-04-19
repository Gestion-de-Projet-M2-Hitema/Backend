import { Request, Response } from "express";
import * as dotenv from "dotenv";

dotenv.config();

// Validation
import joi, { ObjectSchema, ValidationResult } from "joi";
import { buildJoiError } from "../utils/errors.utils";

// Database
const pb = require("../db");

export type FriendRequest = {
  id: string;
  from: string;
  to: string;
};

// Send friend invitation
export const invite = async (req: Request, res: Response) => {
  const userInfo = req.app.locals.user;
  const payload: Object = req.body;
  const schema: ObjectSchema = joi
    .object({
      user: joi.string().min(2).max(255).required(),
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

  const idFriend: string = dataValidated.value.user;

  try {
    const friendExists = await pb.collection("users").getOne(idFriend);
    const requestExists = await pb.collection("friend_requests").getFullList({
      filter: `from = "${userInfo.id}" && to = "${idFriend}"`,
    });

    if (friendExists && requestExists.length == 0) {
      const data = {
        from: userInfo.id,
        to: idFriend,
      };

      await pb.collection("friend_requests").create(data);
      res.sendStatus(201);
    } else {
      res.sendStatus(400);
    }
  } catch (err: any) {
    res.status(400);
  }
};
