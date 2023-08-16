import { Router } from "express";
import {
  getSubscriptions,
  subscribe,
  unSubscribe,
} from "./notification.controller";

const notificationRouter = Router();

notificationRouter.post("/subscribe", subscribe);
notificationRouter.delete("/unsubscribe", unSubscribe);
notificationRouter.post("", getSubscriptions);
export default notificationRouter;
