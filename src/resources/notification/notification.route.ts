import { Router } from "express";
import { subscribe, unSubscribe } from "./notification.controller";

const notificationRouter = Router();

notificationRouter.post("", subscribe);
notificationRouter.delete("", unSubscribe);
export default notificationRouter;
