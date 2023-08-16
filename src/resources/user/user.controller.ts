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

  if (!veriftyDataIsFromTelegram(data, hash)) {
    console.log("not verified");
    return res
      .status(400)
      .json({ message: "telegram data verification failed" });
  }
  if (!chatId) {
    return res.status(400).json({ message: "chatId required" });
  }
  console.log("passed verification");
  try {
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
    console.log(err);
    return res.status(500);
  }
}

function veriftyDataIsFromTelegram(data, hash) {
  const botToken = config.botToken;

  // 1. Parsing the data.
  const parsedData = new URLSearchParams(data);

  // 2. Building the verification string.
  const dataCheckString = Array.from(parsedData.keys())
    .sort()
    .map((key) => `${key}=${parsedData.get(key)}`)
    .join("\n");

  // 3. Calculating the secret key.
  const secretKey = crypto
    .createHmac("sha256", botToken)
    .update("WebAppData")
    .digest();

  // 4. Computing HMAC for the verification string.
  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  // 5. Comparing the computed HMAC with hash.
  if (computedHash !== hash) {
    throw new Error("verification failed");
  }

  return true;
}
