import { Request, Response, NextFunction } from "express";
import { IUser, User } from "./user.model";
import { createUser } from "./user.service";
import * as crypto from "crypto";
import { config } from "../../../config";

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
    let user: IUser;
    user = await User.findOne({ chatId: chatId });
    if (user) {
      return res
        .status(400)
        .json({ message: `user with chatId ${chatId} already exists` });
    }
    user = await createUser({ firstName, chatId, username });

    res.status(200).json({
      firstName: user.firstName,
      username: user.username,
      chatId: user.chatId,
      isBotConnected: user.isBotConnected,
    });
  } catch (err) {
    return res.status(500);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  const { firstName, chatId, username, hash, data } = req.body;

  if (!chatId) {
    return res.status(400).json({ message: "chatId required" });
  }
  try {
    if (!veriftyDataIsFromTelegram(data, hash)) {
      return res
        .status(400)
        .json({ message: "telegram data verification failed" });
    }
    console.log("waht not");
    let user: IUser;
    user = await User.findOne({ chatId: chatId });
    if (!user) {
      user = await createUser({ firstName, chatId, username });
    }

    return res.status(200).json({
      firstName: user.firstName,
      username: user.username,
      chatId: user.chatId,
      isBotConnected: user.isBotConnected,
    });
  } catch (err) {
    return res.status(500).json({ message: "something went wrong" });
  }
}

function veriftyDataIsFromTelegram(data, hash) {
  const botToken = config.botToken;
  const encoder = new TextEncoder();
  const checkString = Object.keys(Object.fromEntries(new URLSearchParams(data)))
    .filter((key) => key !== "hash")
    .map((key) => `${key}=${data[key]}`)
    .sort()
    .join("\n");

  console.log(checkString);
  const secretKey = crypto
    .createHmac("sha256", botToken)
    .update("WebAppData")
    .digest();
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex");

  console.log(signature, hash);

  if (signature === hash) {
    return true;
  }

  return false;
}
