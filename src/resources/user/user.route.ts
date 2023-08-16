import { Router } from "express";
import { login, registerUser } from "./user.controller";

const userRouter = Router();

userRouter.post("", login);
export default userRouter;
