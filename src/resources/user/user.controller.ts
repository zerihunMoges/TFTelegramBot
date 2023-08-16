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
      console.log("not verified");
      return res
        .status(400)
        .json({ message: "telegram data verification failed" });
    }
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

  const checkString = Object.keys(Object.fromEntries(new URLSearchParams(data)))
    .filter((key) => key !== "hash")
    .map((key) => `${key}=${data[key]}`)
    .sort()
    .join("\n");
  console.log(botToken, data);

  const secret_key = crypto
    .createHmac("sha256", botToken)
    .update("WebAppData")
    .digest("hex");
  const computedHash = crypto
    .createHmac("sha256", secret_key)
    .update(checkString)
    .digest("hex");

  console.log(computedHash);
  console.log(hash);
  if (computedHash !== hash) {
    return false;
  }

  return true;
}
