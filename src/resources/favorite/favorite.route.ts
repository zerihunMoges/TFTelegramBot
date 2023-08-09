import { Router } from "express";
import { getUserFavorites } from "./favorite.controller";

const favoriteRouter = Router();

favoriteRouter.get("", getUserFavorites);
export default favoriteRouter;
