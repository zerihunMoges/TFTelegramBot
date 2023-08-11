import { Router } from "express";
import {
  addUserFavorite,
  getUserFavorites,
  removeUserFavorite,
} from "./favorite.controller";

const favoriteRouter = Router();

favoriteRouter.get("", getUserFavorites);
favoriteRouter.post("", addUserFavorite);
favoriteRouter.delete("", removeUserFavorite);
export default favoriteRouter;
