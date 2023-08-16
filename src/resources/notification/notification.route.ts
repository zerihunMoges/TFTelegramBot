import { Router } from "express";
import {
  getSubscriptions,
  subscribe,
  unSubscribe,
} from "./notification.controller";

const notificationRouter = Router();

notificationRouter.post("", subscribe);
notificationRouter.delete("", unSubscribe);
notificationRouter.get("", getSubscriptions);
export default notificationRouter;
