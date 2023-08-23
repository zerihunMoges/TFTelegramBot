import express from "express";
import cors from "cors";
import { bot } from "./user-bot/bot";
import { config } from "../config";
import { connect } from "../db";
import favoriteRouter from "./resources/favorite/favorite.route";
import userRouter from "./resources/user/user.route";
import notificationRouter from "./resources/notification/notification.route";
import { cleanup } from "./message-queue/connection-pool/connectionpool";

const app = express();
app.use(express.json());
app.use(cors({ origin: true }));

app.use("/api/favorites", favoriteRouter);
app.use("/api/users", userRouter);
app.use("/api/notfication", notificationRouter);
export async function start() {
  try {
    await connect();
    app.use(
      await bot.createWebhook({
        domain: config.webHookDomain!,
        path: "/" + config.botToken,
      })
    );

    app.listen(config.port, "0.0.0.0", () => {
      console.log(`REST API on http://localhost:${config.port}/api`);
    });
  } catch (err) {
    console.error("error: ", err);
  } finally {
    cleanup()
      .then(() => {
        console.log("All connections in the pool have been destroyed.");
      })
      .catch((err) => {
        console.error("Error during cleanup:", err);
      });
  }
}
