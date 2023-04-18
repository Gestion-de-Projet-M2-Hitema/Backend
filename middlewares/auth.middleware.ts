import { NextFunction, Response, Request } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import * as dotenv from "dotenv";

dotenv.config();

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header("authorization") || "";
  const token = authHeader && authHeader.split(" ")[1];
  const privateKey = process.env.JWT_PRIVATE_KEY;

  if (!privateKey) {
    res.sendStatus(400);
    return;
  }

  // We decode the token
  try {
    const decoded: JwtPayload & { id: string } = jwt.verify(
      token,
      privateKey
    ) as JwtPayload & { id: string };
    req.app.locals.user = decoded;

    // The middleware has done its job and can make way for the next one.
    next();
  } catch (err) {
    return res.status(400).json({ error: "Invalid Token !" });
  }
};
