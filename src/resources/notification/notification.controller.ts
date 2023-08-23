import { NextFunction, Request, Response } from "express";
import { User } from "../user/user.model";
import { Notification } from "./notification.model";

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

    const notification = await Notification.findOneAndUpdate(
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

    const notification = await Notification.findOneAndDelete({
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

export async function getUserSubscriptions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { chatId, club } = req.body;

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
    const finder: any = { user: user.id, type: "club", notId: club };

    const notifications = await Notification.find(finder).populate({
      path: "user",
      model: User,
      select: "-__v",
    });

    res.status(200).json(notifications);
  } catch (err) {
    return res.status(500);
  }

  res.status(200);
}
