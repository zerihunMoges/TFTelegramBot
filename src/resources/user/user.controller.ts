import { Request, Response, NextFunction } from "express";
import { IUser, User } from "./user.model";
import { createUser } from "./user.service";
const { subtle } = require("crypto").webcrypto;
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

async function veriftyDataIsFromTelegram(data, hash) {
  const botToken = config.botToken;
  const encoder = new TextEncoder();
  const checkString = Object.keys(Object.fromEntries(new URLSearchParams(data)))
    .filter((key) => key !== "hash")
    .map((key) => `${key}=${data[key]}`)
    .sort()
    .join("\n");
  console.log(botToken, data);

  const secretKey = await subtle.importKey(
    "raw",
    encoder.encode("WebAppData"),
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign"]
  );
  const secret = await subtle.sign("HMAC", secretKey, encoder.encode(botToken));
  const signatureKey = await subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign"]
  );
  const signature = await subtle.sign(
    "HMAC",
    signatureKey,
    encoder.encode(checkString)
  );

  const hex = [...new Uint8Array(signature)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  console.log(hex);
  console.log(hash);
  if (hex !== hash) {
    return false;
  }

  return true;
}
