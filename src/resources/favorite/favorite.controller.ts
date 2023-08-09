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
  const { chatId, type, favID, favName } = req.query;

  if (!chatId || !favID || !type) {
    return res.status(400).json({ message: "chatId, type and favId required" });
  }
  try {
    const finder: any = { chatId };

    if (type) {
      finder.type = type;
    }

    const favorite = await Favorite.create({ chatId, type, favID, favName });
    res.status(200);
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}
export async function removeUserFavorite(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { chatId, type, favID } = req.query;

  if (!chatId || !favID || !type) {
    return res.status(400).json({ message: "chatId, type and favId required" });
  }
  try {
    const finder: any = { chatId, type, favID };

    const favorite = await Favorite.findOneAndDelete(finder);
    res.status(200);
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}