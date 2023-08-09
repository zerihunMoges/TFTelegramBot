import { Request, Response, NextFunction } from "express";
import { IUser } from "./user.model";
import { createUser } from "./user.service";

export async function registerUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { firstName, chatId, username }: IUser = req.body;
  if (!chatId) {
    return res.status(400).json({ message: "chatId required" });
  }

  try {
    const user = await createUser({ firstName, chatId, username });
  } catch (err) {
    return res.status(500);
  }

  res.status(200);
}