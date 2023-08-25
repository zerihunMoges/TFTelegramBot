import { Telegraf, Markup, Scenes, Context, session } from "telegraf";
import {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  InlineQueryResult,
} from "telegraf/types";
import { config } from "../../config";
import { User } from "../resources/user/user.model";
import { createUser } from "../resources/user/user.service";
import { Favorite, IFavorite } from "../resources/favorite/favorite.model";

const token = config.botToken;
const webApp = config.webUrl;
export const bot = new Telegraf(token);

function wider(text: string) {
  return `${text}\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0`;
}
bot.telegram.setMyCommands([]);
bot.telegram.setChatMenuButton({
  menuButton: {
    type: "web_app",
    text: "Today's Matches",
    web_app: { url: webApp },
  },
});
bot.catch((err, ctx) => {
  console.error(`Error while handling update ${ctx.update.update_id}:`, err);
  ctx.reply(
    "Oops! Something went wrong. Please try again later or contact our support if the issue persists."
  );
});

bot.start((ctx) => {
  ctx.reply(wider("📣 Let's get started"), {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Today's Matches", web_app: { url: webApp! } }],

        [
          { text: "Leagues", callback_data: `leagues` },
          { text: "Clubs", callback_data: `clubs` },
        ],
      ],
    },
  });
});

bot.action(/leagues/, async (ctx) => {
  let user = await User.findOne({ chatId: ctx.from.id });
  if (!user) {
    user = await createUser({
      chatId: ctx.from.id,
      firstName: ctx.from.first_name,
      username: ctx.from.username,
    });
  }

  const leagues = await Favorite.find({ user: user.id, type: "league" });
  const keyboards: InlineKeyboardButton[][] = leagues.map(
    (league: IFavorite) => {
      return [
        {
          text: league.favName,
          web_app: { url: `${config.webUrl}/league/${league.favId}` },
        },
      ];
    }
  );

  keyboards.push([
    { text: "Today's Matches", web_app: { url: webApp! } },
    { text: "Back", callback_data: `backToHome` },
  ]);
  ctx.editMessageText(wider("🏆 Pinned Leagues"), {
    reply_markup: {
      inline_keyboard: keyboards,
    },
  });
});

bot.action(/clubs/, async (ctx) => {
  let user = await User.findOne({ chatId: ctx.from.id });
  if (!user) {
    user = await createUser({
      chatId: ctx.from.id,
      firstName: ctx.from.first_name,
      username: ctx.from.username,
    });
  }

  const leagues = await Favorite.find({ user: user.id, type: "club" });
  const keyboards: InlineKeyboardButton[][] = leagues.map(
    (league: IFavorite) => {
      return [
        {
          text: league.favName,
          web_app: { url: `${config.webUrl}/club/${league.favId}` },
        },
      ];
    }
  );

  keyboards.push([
    { text: "Today's Matches", web_app: { url: webApp! } },
    { text: "Back", callback_data: `backToHome` },
  ]);
  ctx.editMessageText(wider("🏆 Pinned Leagues"), {
    reply_markup: {
      inline_keyboard: keyboards,
    },
  });
});

bot.action(/backToHome/, async (ctx) => {
  ctx.editMessageText(wider("📣 Let's get started"), {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Today's Matches",
            web_app: { url: webApp! },
          },
        ],

        [
          { text: "Leagues", callback_data: `leagues` },
          { text: "Clubs", callback_data: `clubs` },
        ],
      ],
    },
  });
});

bot.action(/connectBot/, async (ctx) => {});
// bot.telegram.setWebhook(config.webHookDomain + "/" + config.botToken);

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
