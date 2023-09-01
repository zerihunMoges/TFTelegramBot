import { NextFunction, Request, Response } from "express";
import { User } from "../user/user.model";
import { INotification, Notification } from "./notification.model";

export async function subscribe(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { userId, type, notId } = req.body;
  if (!userId || !notId || !type) {
    return res.status(400).json({ message: "userId, type and notId required" });
  }

  try {
    const user = await User.findById({ _id: userId });
    if (!user) {
      return res
        .status(400)
        .json({ message: `user with id ${userId} doesn't exist` });
    }

    const notification = await Notification.findOneAndUpdate(
      { type, notId, user: user._id },
      { type, notId, targetType: "user" },
      { upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ response: notification });
  } catch (err) {
    return res.status(500).json({ message: "internal server error" });
  }
}

export async function unSubscribe(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ message: "id required" });
    }

    const notification = await Notification.findByIdAndDelete(id);

    res.status(200).json({ response: notification });
  } catch (err) {
    return res.status(500);
  }
}

export async function getUserSubscriptionsByClub(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { userId, notId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "chatId required" });
  }

  try {
    const finder: any = { user: userId, type: "club", notId: notId };

    const notification = await Notification.findOne(finder).populate({
      path: "user",
      model: User,
      select: "-__v",
    });

    res.status(200).json({ response: notification });
  } catch (err) {
    return res.status(500).json({ message: "internal server error" });
  }
}

export async function getAllSubscription(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const subscribers: any = await Notification.find()
      .populate("user")
      .populate("channel");
    const uniqueSub = new Set();
    const filteredNotifications = subscribers.filter((notification) => {
      if (uniqueSub.has(`${notification.type}-${notification.notId}`))
        return false;
      uniqueSub.add(`${notification.type}-${notification.notId}`);
      return notification.user?.active || notification.channel?.active;
    });

    const selectedFields = filteredNotifications.map((notification) => ({
      id: notification._id,
      type: notification.type,
      notId: notification.notId,
    }));
    return res.status(200).json({ response: selectedFields });
  } catch (err) {
    console.error("error occurred while getting all subscribers: ", err);
    return res.status(500).json({ message: "" });
  }
}

export async function getSubscriptions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { home, away, league } = req.query;
  try {
    let subscribers: INotification[] = [];
    if (!home && !league && !away) {
      return res
        .status(400)
        .json({ message: "home id, away id or league id required" });
    }

    subscribers = await Notification.find({
      $or: [
        { $and: [{ type: "league" }, { notId: league }] },
        {
          $and: [{ type: "club" }, { $or: [{ notId: home }, { notId: away }] }],
        },
      ],
    });

    return res.status(200).json({ response: subscribers });
  } catch (err) {
    console.error("error occurred while getting subscribers: ", err);
    return res.status(500).json({ message: "" });
  }
}
