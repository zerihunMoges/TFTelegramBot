import { Request, Response, NextFunction } from "express";
import { Favorite } from "./favorite.model";
import { User } from "../user/user.model";
import { createUser } from "../user/user.service";

export async function getUserFavorites(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { userId, type } = req.query;

  if (!userId || !type) {
    return res.status(400).json({ message: "userId and type required" });
  }
  try {
    const favorites = await Favorite.find({ user: userId, type });
    res.status(200).json(favorites);
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
  const { userId, type, favId, favName, favImage } = req.body;

  try {
    if (!userId || !favId || !type || !favName || !favImage) {
      return res.status(400).json({
        message: "userId, type, favName, favImage and favId required",
      });
    }

    if (!User.findById(userId)) {
      return res.status(400).json({ message: "user not found" });
    }

    const favorite = await Favorite.findOneAndUpdate(
      { user: userId, type, favId },
      {
        user: userId,
        type,
        favId,
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
  const { userId, type, favId } = req.body;

  if (!userId || !favId || !type) {
    return res.status(400).json({ message: "userId, type and favId required" });
  }
  try {
    const finder: any = { user: userId, type, favId };

    const favorite = await Favorite.findOneAndDelete(finder);
    res.status(200).json(favorite);
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}
