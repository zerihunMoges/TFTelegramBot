import { Request, Response, NextFunction } from "express";
import { Favorite } from "./favorite.model";
import { User } from "../user/user.model";
import { createUser } from "../user/user.service";

export async function getUserFavorites(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { chatId, type } = req.query;

  if (!chatId || !type) {
    return res.status(400).json({ message: "chatId and type required" });
  }
  try {
    const user = await User.findOne({ chatId: chatId });
    console.log(user);
    if (!user) {
      console.log("create");
      await createUser({ chatId: chatId.toString() });
    }

    const favorites = await Favorite.find({ chatId, type });
    res.status(200).json({ response: favorites });
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}
export async function addUserFavorite(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { chatId, type, favID, favName, favImage } = req.body;

  try {
    if (!chatId || !favID || !type || !favName || !favImage) {
      return res.status(400).json({
        message: "chatId, type, favName, favImage and favId required",
      });
    }

    const favorite = await Favorite.findOneAndUpdate(
      { chatId, type, favID },
      {
        chatId,
        type,
        favID,
        favName,
        favImage,
      },
      {
        upsert: true,
      }
    );

    return res.status(200).json(favorite);
  } catch (err) {
    console.error(err);
    return res.status(500).json();
  }
}
export async function removeUserFavorite(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { chatId, type, favID } = req.body;

  if (!chatId || !favID || !type) {
    return res.status(400).json({ message: "chatId, type and favId required" });
  }
  try {
    const finder: any = { chatId, type, favID };

    const favorite = await Favorite.findOneAndDelete(finder);
    res.status(200).json(favorite);
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}
