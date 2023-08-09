import { Router } from "express";
import { registerUser } from "./user.controller";

const userRouter = Router();

userRouter.post("", registerUser);
export default userRouter;
