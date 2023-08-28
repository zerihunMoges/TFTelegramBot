import { Router } from "express";
import {
  getAllSubscription,
  getSubscriptions,
  getUserSubscriptionsByClub,
  subscribe,
  unSubscribe,
} from "./notification.controller";

const notificationRouter = Router();

notificationRouter.post("/subscribe", subscribe);
notificationRouter.delete("/unsubscribe/:id", unSubscribe);
notificationRouter.get("", getSubscriptions);
notificationRouter.get("/all", getAllSubscription);
notificationRouter.get("/user", getUserSubscriptionsByClub);
export default notificationRouter;
