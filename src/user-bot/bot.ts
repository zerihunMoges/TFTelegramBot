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
import { message } from "telegraf/filters";

const token = "6589781420:AAE5fXufYISaSGOilIZvP1dn79tmeNAX0g8";
const webApp = config.webUrl;
const startKeyboard = [
  [{ text: "Today's Matches", web_app: { url: webApp! } }],

  [
    { text: "Leagues", callback_data: `leagues` },
    { text: "Clubs", callback_data: `clubs` },
  ],
  [{ text: "⚙️ Notification Settings", callback_data: `notsettings` }],
];

export const bot = new Telegraf<Scenes.SceneContext>(token);

export const connectBotScene = new Scenes.BaseScene<any>("connect_bot_scene");

const stage = new Scenes.Stage<Scenes.SceneContext>([connectBotScene]);

bot.use(session());
bot.use(stage.middleware());

connectBotScene.on(message("text"), async (ctx) => {
  const token = ctx.message.text;
  console.log("this is the token", token);
  try {
    const userBot = new Telegraf(token);
    await userBot.telegram.sendMessage(ctx.from.id, "hey this is test message");
    const user = await User.findOne({ chatId: ctx.message.from.id });
    user.botToken = token;
    user.isBotConnected = true;
    await user.save();
    await ctx.reply(
      "Bot connected successfully. I will send you match notifications from your favorite club through the bot.",
      {
        reply_markup: {
          keyboard: [],
        },
      }
    );
    await ctx.scene.leave("connect_bot_scene");
  } catch (err) {
    console.error("error occurred in connect bot scene", err);
  }
});

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
      inline_keyboard: startKeyboard,
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

bot.action(/notsetting/, async (ctx) => {
  let user = await User.findOne({ chatId: ctx.from.id });
  if (!user) {
    user = await createUser({
      chatId: ctx.from.id,
      firstName: ctx.from.first_name,
      username: ctx.from.username,
    });
  }

  if (!user.isBotConnected) {
    return ctx.reply(
      "You haven't connected a notification bot yet, please send /connectbot"
    );
  }

  ctx.editMessageText("⚙️ Notification Settings", {
    reply_markup: {
      inline_keyboard: [[{ text: "Back", callback_data: `backToHome` }]],
    },
  });
});

bot.action(/backToHome/, async (ctx) => {
  ctx.editMessageText(wider("📣 Let's get started"), {
    reply_markup: {
      inline_keyboard: startKeyboard,
    },
  });
});

bot.command(/connectbot/, async (ctx) => {
  await ctx.scene.enter("connect_bot_scene");
  await ctx.reply(
    "To connect a bot for live match Notification, please follow these steps\n\n 1️⃣ Go to @BotFather. Press his name to do that and then press 'Start' if it's needed\n 2️⃣ Create a new bot with him. To do this send the '/newbot' command inside @BotFather.\n3️⃣ Copy the API token that @BotFather will give you.\n4️⃣ Come back to @telefootballbot and send the copied API token here.",
    {
      reply_markup: {
        keyboard: [[{ text: "Cancel" }]],
        one_time_keyboard: true,
      },
    }
  );
});
// bot.telegram.setWebhook(config.webHookDomain + "/" + config.botToken);
bot.hears("Cancel", async (ctx) => {
  await ctx.scene.leave();

  await ctx.reply("bot connecting canceled", {
    reply_markup: {
      keyboard: [],
    },
  });
});
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
