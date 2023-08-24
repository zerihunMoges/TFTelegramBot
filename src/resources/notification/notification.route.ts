import { Router } from "express";
import {
  getAllSubscription,
  getSubscriptions,
  subscribe,
  unSubscribe,
} from "./notification.controller";

const notificationRouter = Router();

notificationRouter.post("/subscribe", subscribe);
notificationRouter.delete("/unsubscribe", unSubscribe);
notificationRouter.get("", getSubscriptions);
notificationRouter.get("/all", getAllSubscription);
export default notificationRouter;
