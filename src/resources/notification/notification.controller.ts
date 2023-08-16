import { NextFunction, Request, Response } from "express";
import { User } from "../user/user.model";
import { UserNotification } from "./notification.model";

export async function subscribe(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { chatId, type, notId } = req.body;
  if (!chatId || !notId || !type) {
    return res.status(400).json({ message: "chatId, type and notId required" });
  }

  try {
    const user = await User.findOne({ chatId });
    if (!user) {
      return res
        .status(400)
        .json({ message: `user with chatId ${chatId} doesn't exist` });
    }

    const notification = await UserNotification.findOneAndUpdate(
      { chatId, type, notId },
      { chatId, type, notId, botToken: user.botToken }
    );

    res.status(200).json(notification);
  } catch (err) {
    return res.status(500);
  }

  res.status(200);
}

export async function unSubscribe(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { chatId, type, notId } = req.body;
  if (!chatId || !notId || !type) {
    return res.status(400).json({ message: "chatId, type and notId required" });
  }

  try {
    const user = await User.findOne({ chatId });
    if (!user) {
      return res
        .status(400)
        .json({ message: `user with chatId ${chatId} doesn't exist` });
    }

    const notification = await UserNotification.findOneAndDelete({
      chatId,
      type,
      notId,
    });

    res.status(200).json(notification);
  } catch (err) {
    return res.status(500);
  }

  res.status(200);
}

export async function getSubscriptions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { chatId, type, notId } = req.query;

  if (!chatId) {
    return res.status(400).json({ message: "chatId required" });
  }

  try {
    const user = await User.findOne({ chatId });
    if (!user) {
      return res
        .status(400)
        .json({ message: `user with chatId ${chatId} doesn't exist` });
    }
    const finder: any = { chatId };
    if (type) finder.type = type;
    if (notId) finder.notId = notId;
    const notifications = await UserNotification.find(finder);

    res.status(200).json(notifications);
  } catch (err) {
    return res.status(500);
  }

  res.status(200);
}
