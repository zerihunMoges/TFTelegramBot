import { Telegraf, Markup, Scenes, Context, session } from "telegraf";
import { InlineKeyboardMarkup, InlineQueryResult } from "telegraf/types";
import { config } from "../config";

const token = config.botToken;
const webApp = config.webApp;
export const bot = new Telegraf(token);
bot.telegram.setMyCommands([
  { command: "addchannel", description: "Add a channel" },
]);

bot.catch((err, ctx) => {
  console.error(`Error while handling update ${ctx.update.update_id}:`, err);
  ctx.reply(
    "Oops! Something went wrong. Our team has been notified and we’re working hard to fix the issue. Please try again later or contact our support if the issue persists."
  );
});

bot.start((ctx) => {
  ctx.reply("📣 Let's get started", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Today's Matches", web_app: { url: webApp! } }],
      ],
    },
  });
});

bot.telegram.setWebhook(config.webHookDomain);

bot
  .launch({ webhook: { domain: config.webHookDomain!, port: 8443 } })
  .then(() => console.log("Webhook bot listening on port", 8443));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
