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

  // Verify if the user is not himself
  if (idFriend === userInfo.id) {
    return res.sendStatus(400);
  }

  try {
    const friendExists = await pb.collection("users").getOne(idFriend);
    const requestExists = await pb.collection("friend_requests").getFullList({
      filter: `from = "${userInfo.id}" && to = "${idFriend}"`,
    });

    // Verify if the friend is already defined
    if (friendExists.friends.includes(userInfo.id)) {
      return res.status(400).json({ error: "The user is already your friend" });
    }

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

// Accept a friend request
export const accept = async (req: Request, res: Response) => {
  const userInfo = req.app.locals.user;
  const requestId: string = req.params.id;

  try {
    // Get the friend request
    const friendRequest = await pb
      .collection("friend_requests")
      .getOne(requestId);

    // Get the users
    const userFrom = await pb.collection("users").getOne(friendRequest.from);
    const userTo = await pb.collection("users").getOne(friendRequest.to);

    // Verify if the user is valid
    if (userTo.id !== userInfo.id) {
      return res.status(400).json({ error: "You don't have permission" });
    }

    // Add the friend into their friend list
    await pb.collection("users").update(userFrom.id, {
      friends: [...userFrom.friends, userTo.id],
    });
    await pb.collection("users").update(userTo.id, {
      friends: [...userTo.friends, userFrom.id],
    });

    // Delete the friend request
    await pb.collection("friend_requests").delete(requestId);

    return res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    return res.status(400).json({ error: err });
  }
};

// Decline a friend request
export const decline = async (req: Request, res: Response) => {
  const userInfo = req.app.locals.user;
  const requestId: string = req.params.id;

  try {
    // Get the friend request
    const friendRequest = await pb
      .collection("friend_requests")
      .getOne(requestId);

    // Get the users
    const userTo = await pb.collection("users").getOne(friendRequest.to);

    // Verify if the user is valid
    if (userTo.id !== userInfo.id) {
      return res.status(400).json({ error: "You don't have permission" });
    }

    // Delete the friend request
    await pb.collection("friend_requests").delete(requestId);

    return res.status(200).json({ message: "Friend request declined" });
  } catch (err) {
    return res.status(400).json({ error: err });
  }
};

// List all the user friends
export const list = async (req: Request, res: Response) => {
  const userInfo = req.app.locals.user;

  try {
    const user = await pb.collection("users").getOne(userInfo.id);
    const friends: Record<string, string>[] = [];

    for (const idFriend of user.friends) {
      try {
        const friend = await pb.collection("users").getOne(idFriend);
        const avatar = friend.avatar
          ? pb.files.getUrl(friend, friend.avatar)
          : null;

        friends.push({
          id: friend.id,
          username: friend.username,
          avatar: avatar,
        });
      } catch (err: any) {}
    }

    res.status(200).json(friends);
    return;
  } catch (err: any) {
    res.status(400);
    return;
  }
};

// List all the user friend requests
export const listRequests = async (req: Request, res: Response) => {
  const userInfo = req.app.locals.user;

  try {
    const listRequests = await pb.collection("friend_requests").getFullList({
      filter: `to = "${userInfo.id}"`,
    });
    const requests: Record<string, string>[] = [];

    for (const request of listRequests) {
      try {
        const friend = await pb.collection("users").getOne(request.from);
        const avatar = friend.avatar
          ? pb.files.getUrl(friend, friend.avatar)
          : null;

        requests.push({
          idRequest: request.id,
          id: friend.id,
          username: friend.username,
          avatar: avatar,
        });
      } catch (err: any) {}
    }

    res.status(200).json(requests);
    return;
  } catch (err: any) {
    res.status(400);
    return;
  }
};

// Delete a friend
export const removeFriend = async (req: Request, res: Response) => {
  const userInfo = req.app.locals.user;
  const friendId: string = req.params.id;

  try {
    // Get the user that requested deletion
    const userFrom = await pb.collection("users").getOne(userInfo.id);
    const userTo = await pb.collection("users").getOne(friendId);

    // Remove the friend
    await pb.collection("users").update(userFrom.id, {
      friends: userFrom.friends.filter((item: string) => item != friendId),
    });
    await pb.collection("users").update(userTo.id, {
      friends: userTo.friends.filter((item: string) => item != userInfo.id),
    });

    return res.status(200).json({ message: "Friend removed" });
  } catch (err) {
    return res.status(400).json({ error: err });
  }
};
