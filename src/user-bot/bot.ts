import {
  Telegraf,
  Markup,
  Scenes,
  Context,
  session,
  NarrowedContext,
} from "telegraf";
import {
  CallbackQuery,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  InlineQueryResult,
  Update,
  UserFromGetMe,
} from "telegraf/types";
import { config } from "../../config";
import { NotificationSetting, User } from "../resources/user/user.model";
import { createUser } from "../resources/user/user.service";
import { Favorite, IFavorite } from "../resources/favorite/favorite.model";
import { message } from "telegraf/filters";
import {
  INotification,
  Notification,
} from "../resources/notification/notification.model";
import { getClub, getLeague } from "../channel-bot/botservice";
import { EventType, SubscriptionType } from "../types/action.type";
import mongoose, { Schema } from "mongoose";

const token = config.botToken;
const webApp = config.webUrl;
const startKeyboard = [
  [{ text: "Today's Matches", web_app: { url: webApp! } }],

  [
    { text: "📌 Pinned Leagues", callback_data: `leagues` },
    { text: "📌 Pinned Clubs", callback_data: `clubs` },
  ],
];
// [{ text: "Following Clubs", callback_data: `notifications:club` }],
//   [
//     {
//       text: "⚙️ Notification Settings",
//       callback_data: `profileNotSetting:`,
//     },
//   ],
export const bot = new Telegraf<Scenes.SceneContext>(token);

export const connectBotScene = new Scenes.BaseScene<any>("connect_bot_scene");

const stage = new Scenes.Stage<Scenes.SceneContext>([connectBotScene]);

bot.use(session());
bot.use(stage.middleware());

connectBotScene.on(message("text"), async (ctx) => {
  const token = ctx.message.text;

  if (token === "Cancel") {
    await ctx.scene.leave();

    return await ctx.reply("Canceled", {
      reply_markup: {
        remove_keyboard: true,
      },
    });
  }

  try {
    const newBot = new Telegraf(token);
    let newBotData: UserFromGetMe;
    await newBot.telegram
      .getMe()
      .then((userData) => {
        newBotData = userData;
      })
      .catch(async (err) => {
        if (err.code === 401 || err.code === 404) {
          return await ctx.reply(
            "Invalid bot token,please make sure you have copied the whole token string which looks something like `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11` and send token again!"
          );
        }
        console.error("error occured while getting bot data", err);
      });
    const user = await User.findOne({ chatId: ctx.message.from.id });
    user.botToken = token;
    user.isBotConnected = true;
    await user.save();
    await ctx.reply(
      `Bot @${newBotData.username} connected successfully. I will send you match notifications from your favorite club through @${newBotData.username}, Don’t forget to start the bot to begin receiving updates!`,
      {
        reply_markup: {
          remove_keyboard: true,
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
    text: "Explore Matches",
    web_app: { url: webApp },
  },
});
bot.catch(async (err, ctx) => {
  console.error(`Error while handling update ${ctx.update.update_id}:`, err);
  const message = await ctx.reply(
    "Oops! Something went wrong. Please try again later or contact our support if the issue persists."
  );

  setTimeout(async () => {
    await ctx.deleteMessage(message.message_id);
  }, 2000);
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
bot.action(/notifications:(.+)/, async (ctx) => {
  const [type] = ctx.match[1].split(":");
  await getNotificationsList(ctx, type as SubscriptionType);
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

  const clubs = await Favorite.find({ user: user.id, type: "club" });
  const keyboards: InlineKeyboardButton[][] = clubs.map((league: IFavorite) => {
    return [
      {
        text: league.favName,
        web_app: { url: `${config.webUrl}/club/${league.favId}` },
      },
    ];
  });

  keyboards.push([
    { text: "Today's Matches", web_app: { url: webApp! } },
    { text: "Back", callback_data: `backToHome` },
  ]);
  ctx.editMessageText(wider("🏆 Pinned Clubs"), {
    reply_markup: {
      inline_keyboard: keyboards,
    },
  });
});

bot.action(/notSetting:(.+)/, async (ctx) => {
  const [type, id, notType] = ctx.match[1].split(":");
  const user = await User.findOne({ chatId: ctx.from.id });
  const notification = await Notification.findOne({
    user: user.id,
    type: type,
    notId: id,
    targetType: "user",
  });
  let name: string;
  if (type === "club") {
    await getClub(id).then((club) => {
      name = `${club.team.name} (${club.team.country})`;
    });
  }
  if (type === "league") {
    await getLeague(id).then((league) => {
      name = `${league.league.name} (${league.country.name})`;
    });
  }

  if (notType === "remove") {
    await Notification.findByIdAndDelete(notification.id)
      .then(async () => {
        try {
          const message = await ctx.reply(
            "Success! Your notification subscription has been removed."
          );
          setTimeout(async () => {
            await ctx.deleteMessage(message.message_id);
          }, 2000);
        } catch (err) {
          console.error("error occured while sending success message", err);
        }
      })
      .catch(async (err) => {
        console.error("error occured deleting notification", err);
        await ctx.reply("Operation failed, something went wrong!");
      });

    return await getNotificationsList(ctx, type as SubscriptionType);
  }
  const notificationSetting = notification.notificationSetting;
  changeNotificationSetting(notificationSetting, notType as EventType);
  await notification.save();

  let keyboards: InlineKeyboardButton[][] = getNotificationSettingButtons(
    notificationSetting,
    (notType: string) => {
      return `notSetting:${type}:${id}:${notType}`;
    }
  );

  keyboards.push([
    {
      text: `🗑️ Remove`,
      callback_data: `notSetting:${type}:${id}:remove`,
    },
  ]);
  keyboards.push([{ text: "Back", callback_data: `notifications:${type}` }]);
  await ctx.editMessageText(`⚙️ ${name.toUpperCase()} Notification Settings`, {
    reply_markup: {
      inline_keyboard: keyboards,
    },
  });
});

bot.action(/profileNotSetting:(.*)/, async (ctx) => {
  const [notType] = ctx.match[1].split(":");
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
  changeNotificationSetting(user.notificationSetting, notType as EventType);
  await user.save();

  let keyboards: InlineKeyboardButton[][] = getNotificationSettingButtons(
    user.notificationSetting,
    (notType: string) => {
      return `profileNotSetting:${notType}`;
    }
  );
  keyboards.push([{ text: "Back", callback_data: `backToHome` }]);
  await ctx.editMessageText("⚙️ Notification Settings", {
    reply_markup: {
      inline_keyboard: keyboards,
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
    "To connect a bot for live match Notification, please follow these steps\n\n 1️⃣ Go to @BotFather. Press his name to do that and then press 'Start' if it's needed\n 2️⃣ Create a new bot with him. To do this send the '/newbot' command inside @BotFather.\n3️⃣ Copy the API token that @BotFather will give you. The token looks something like `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`\n4️⃣ Come back to @telefootballbot and send the copied API token here.",
    {
      reply_markup: {
        keyboard: [[{ text: "Cancel" }]],
        resize_keyboard: true,
      },
    }
  );
});

async function getNotificationsList(
  ctx: NarrowedContext<
    Scenes.SceneContext<Scenes.SceneSessionData> & {
      match: RegExpExecArray;
    },
    Update.CallbackQueryUpdate<CallbackQuery>
  >,
  type: SubscriptionType
) {
  let user = await User.findOne({ chatId: ctx.from.id });
  if (!user) {
    user = await createUser({
      chatId: ctx.from.id,
      firstName: ctx.from.first_name,
      username: ctx.from.username,
    });
  }

  console.log(user, type, user.id);

  const leagues = await Notification.find({
    user: user.id,
    type: type,
    targetType: "user",
  });

  console.log(leagues);
  let keyboards: InlineKeyboardButton[][] = [];

  if (type === "league") {
    keyboards = await Promise.all(
      leagues.map(async (league: INotification) => {
        const leagueRes = await getLeague(league.notId);
        return [
          {
            text: `⚙️ ${leagueRes.league.name}`,
            callback_data: `notSetting:${type}:${leagueRes.league.id}`,
          },
        ];
      })
    );
  }

  if (type === "club") {
    keyboards = await Promise.all(
      leagues.map(async (league: INotification) => {
        const clubRes = await getClub(league.notId);
        return [
          {
            text: `⚙️ ${clubRes.team.name}`,
            callback_data: `notSetting:${type}:${clubRes.team.id}`,
          },
        ];
      })
    );
  }

  keyboards.push([{ text: "Back", callback_data: `backToHome` }]);
  ctx.editMessageText(wider(`🔔 Subscribed ${type.toUpperCase()}S`), {
    reply_markup: {
      inline_keyboard: keyboards,
    },
  });
}

export function getNotificationSettingButtons(
  notificationSetting: NotificationSetting,
  callBackGenarator: (notType: string) => string
) {
  return [
    [
      {
        text: `${notificationSetting.goal ? "🔔" : "🔕"} Goal`,
        callback_data: callBackGenarator("goal"),
      },
      {
        text: `${notificationSetting.yellowCard ? "🔔" : "🔕"} Yellow Card`,
        callback_data: callBackGenarator("yellowCard"),
      },
    ],
    [
      {
        text: `${notificationSetting.redCard ? "🔔" : "🔕"} Red Card`,
        callback_data: callBackGenarator("redCard"),
      },
      {
        text: `${notificationSetting.substitution ? "🔔" : "🔕"} Substitiution`,
        callback_data: callBackGenarator("substitution"),
      },
    ],
    [
      {
        text: `${notificationSetting.var ? "🔔" : "🔕"} Var`,
        callback_data: callBackGenarator("var"),
      },
      {
        text: `${notificationSetting.lineups ? "🔔" : "🔕"} Lineups`,
        callback_data: callBackGenarator("lineups"),
      },
    ],
    [
      {
        text: `${notificationSetting.break ? "🔔" : "🔕"} Breaks`,
        callback_data: callBackGenarator("break"),
      },
    ],
    [
      {
        text: `${notificationSetting.FT ? "🔔" : "🔕"} 
        .Full Time`,
        callback_data: callBackGenarator("FT"),
      },
    ],
  ];
}

export function changeNotificationSetting(
  notificationSetting: NotificationSetting,
  eventType: EventType
) {
  if (eventType === "goal")
    notificationSetting.goal = !notificationSetting.goal;
  else if (eventType === "yellowCard")
    notificationSetting.yellowCard = !notificationSetting.yellowCard;
  else if (eventType === "redCard")
    notificationSetting.redCard = !notificationSetting.redCard;
  else if (eventType === "lineups")
    notificationSetting.lineups = !notificationSetting.lineups;
  else if (eventType === "substitution")
    notificationSetting.substitution = !notificationSetting.substitution;
  else if (eventType === "var")
    notificationSetting.var = !notificationSetting.var;
  else if (eventType === "FT") notificationSetting.FT = !notificationSetting.FT;
  else if (eventType === "break")
    notificationSetting.break = !notificationSetting.break;
}
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
