import express from "express";
import cors from "cors";
import { bot } from "./bot";
import { config } from "../config";
import { connect } from "../db";
import favoriteRouter from "./resources/favorite/favorite.route";
import userRouter from "./resources/user/user.route";

const app = express();

app.use(cors({ origin: true }));

app.use("/api/favorites", favoriteRouter);
app.use("/api/users", userRouter);
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
  }
}
