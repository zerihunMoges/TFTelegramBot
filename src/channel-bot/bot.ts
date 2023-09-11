import { Telegraf, Markup, Scenes, Context, session } from "telegraf";
import {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  InlineQueryResult,
} from "telegraf/types";
import { addChannel } from "../resources/channel/channel.functions";
import {
  extractQuery,
  handleClubsQuery,
  handleLeaguesQuery,
} from "./botinlinequery-handlers";
import {
  Channel,
  NotificationSetting,
} from "../resources/channel/channel.model";
import { getClub, getLeague, getLeagues } from "./botservice";
import { config } from "../../config";
import { Notification } from "../resources/notification/notification.model";
import { channel } from "diagnostics_channel";
import { User } from "../resources/user/user.model";
import { EventType } from "../types/action.type";
import {
  changeNotificationSetting,
  getNotificationSettingButtons,
} from "../user-bot/bot";
import { countries } from "../data/countries";
import { off } from "process";

const token = config.channelBotToken;
export const bot = new Telegraf<Scenes.SceneContext>(token);

export const addChannelScene = new Scenes.BaseScene<any>("add_channel_scene");

const stage = new Scenes.Stage<Scenes.SceneContext>([addChannelScene]);

bot.use(session());
bot.use(stage.middleware());

const pickSubscriptionMethodKeyboard = Markup.inlineKeyboard([
  [Markup.button.switchToCurrentChat("League", "#Leagues ", false)],
  [{ text: "Club", callback_data: "countries:0" }],
]);

bot.telegram.setMyCommands([
  { command: "menu", description: "menu" },
  { command: "mychannels", description: "my channels" },
  { command: "addchannel", description: "new channel" },
]);

bot.catch((err, ctx) => {
  console.error(`Error while handling update ${ctx.update.update_id}:`, err);
  ctx.reply(
    "Oops! Something went wrong. Our team has been notified and we’re working hard to fix the issue. Please try again later or contact our support if the issue persists."
  );
});

bot.start((ctx) => {
  ctx.reply(
    "📣 Choose your preferred subscription option below, you can add multiple different subscription for channel \n\n 1. Follow a specific league ⚽\n\n 2. Follow a club 🏆 \n\n 3. Follow a specific match 🥅 \n\n Select one of the buttons to get started! 🎉",
    pickSubscriptionMethodKeyboard
  );
});

bot.command("menu", async (ctx) => {
  await ctx.reply(
    "📣 Choose your preferred subscription option below, you can add multiple different subscription for channel \n\n 1. Follow a specific league ⚽\n\n 2. Follow a club 🏆 \n\n 3. Follow a specific match 🥅 \n\n Select one of the buttons to get started! 🎉",
    pickSubscriptionMethodKeyboard
  );
});

bot.command("mychannels", async (ctx) => {
  const user = await User.findOne({ chatId: ctx.from.id });
  const channels = await Channel.find({ users: { $in: [user.id] } });
  const keyboard = channels.map<InlineKeyboardButton[]>((channel) => {
    return [{ text: channel.title, callback_data: `channel:${channel.id}` }];
  });
  await ctx.reply("Channels:", {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
});

bot.command("addchannel", async (ctx) => {
  await ctx.scene.enter("add_channel_scene");
  await ctx.reply(
    "To add your channel, please follow these steps\n\n 1. Add @tfautoch as an admin to your channel or group and grant it post rights.\n\n2. Send your channel’s || Group username or forward a post from your private channel for verification.\n\nThis will allow us to verify that @tfautoch have the necessary permissions to post on your channel/Group.",
    {
      reply_markup: {
        keyboard: [["Cancel"]],
        resize_keyboard: true,
      },
    }
  );
});

bot.on("chosen_inline_result", async (ctx) => {
  const result = ctx.chosenInlineResult;
  let answerKeyboard: InlineKeyboardMarkup = {
    inline_keyboard: [],
  };
  const [type, id] = result.result_id.split(" ");
  const user = await User.findOne({ chatId: ctx.from.id });
  const userChannels = await Channel.find({ users: { $in: [user.id] } });

  userChannels.forEach((channel) => {
    answerKeyboard.inline_keyboard.push([
      {
        text: `${channel.title}`,
        callback_data: `pch:${channel.chatId}:${type}:${id}`,
      },
    ]);
  });

  if (userChannels.length === 0) {
    return await ctx.reply(
      "No channel found!, click /addchannel to add a new channel"
    );
  }

  return await ctx.reply("Select your channel", {
    reply_markup: answerKeyboard,
  });
});

bot.action(/chosen_inline_result:(.+)/, async (ctx) => {
  const [type, id] = ctx.match[1].split(":");
  let answerKeyboard: InlineKeyboardMarkup = {
    inline_keyboard: [],
  };

  const user = await User.findOne({ chatId: ctx.from.id });
  const userChannels = await Channel.find({ users: { $in: [user.id] } });

  userChannels.forEach((channel) => {
    answerKeyboard.inline_keyboard.push([
      {
        text: `${channel.title}`,
        callback_data: `pch:${channel.chatId}:${type}:${id}`,
      },
    ]);
  });

  if (userChannels.length === 0) {
    return await ctx.reply(
      "No channel found!, click /addchannel to add a new channel"
    );
  }

  return await ctx.reply("Select your channel", {
    reply_markup: answerKeyboard,
  });
});

addChannelScene.on("message", async (ctx) => {
  const msg = ctx.message;
  let channelUsername: string | number;
  if ("forward_from_chat" in msg) {
    channelUsername = msg.forward_from_chat.id;
    if (!channelUsername) {
      await ctx.reply("Sorry, I couldn’t get the chat ID. Please try again!");
    }
  } else if ("text" in msg) {
    channelUsername = msg.text;
    if (channelUsername === "Cancel") {
      return await ctx.reply("Canceled", {
        reply_markup: {
          remove_keyboard: true,
        },
      });
    }

    const usernameRegex = /(?:https?:\/\/)?(?:t\.me\/)?@?(\w+)/;
    const match = channelUsername.match(usernameRegex);
    if (match) {
      channelUsername = "@" + match[1];
    } else {
      await ctx.reply("Sorry, I couldn't understand the channel username");
    }
  } else return;

  try {
    const chat = await ctx.telegram.getChat(channelUsername);

    if (chat.type !== "channel") {
      await ctx.reply("Sorry, this is not a channel");
      return;
    }
    const me = await ctx.telegram.getChatMember(
      channelUsername,
      ctx.botInfo.id
    );

    const user = await ctx.telegram.getChatMember(channelUsername, ctx.from.id);
    if (
      me.status === "administrator" &&
      me.can_post_messages &&
      (user.status === "administrator" || user.status === "creator")
    ) {
      const channel = await addChannel({
        chatId: chat.id,
        title: chat.title,
        username: chat.username,
        userChatId: ctx.chat.id,
      });

      await ctx.reply(
        "Channel added successfully, you can now add notifcation subscription to your channel"
      );
      return;
    } else {
      if (user.status !== "administrator" && user.status !== "creator")
        return await ctx.reply(
          `Sorry, you are not an administrator in ${chat.title}`
        );
      if (me.status !== "administrator" || me.can_post_messages)
        return await ctx.reply(
          "Sorry, I don’t have the necessary privileges to post on your channel. Please make sure to grant me the right to post and try again. Thank you!"
        );
    }
  } catch (error) {
    if (
      error.description === "Bad Request: chat not found" ||
      error.description === "Forbidden: bot is not a member of the channel chat"
    ) {
      await ctx.reply(
        "ohh, seems like i am not in your channel, please add me to your channel as an admin with post right and try again!"
      );
    } else {
      await ctx.reply(
        "Sorry, Request failed for some reason, Please try again!"
      );
      console.error(error);
    }
  } finally {
    return await ctx.scene.leave();
  }
});

bot.on("inline_query", async (ctx) => {
  try {
    const offset = ctx.inlineQuery.offset
      ? parseInt(ctx.inlineQuery.offset)
      : 0;
    const limit = 10;
    const query = ctx.inlineQuery.query;

    const { type, country, actualQuery } = extractQuery(query);
    let header: InlineQueryResult = {
      type: "article",
      id: "header",
      title: "",
      input_message_content: {
        message_text: "/start",
      },
    };
    let results: InlineQueryResult[] = [];

    if (type === "#Leagues") {
      results = await handleLeaguesQuery(limit, offset, actualQuery);
    }
    if (type === "#Clubs") {
      results = await handleClubsQuery(country, limit, offset, actualQuery);
    }

    return await ctx.answerInlineQuery([...results], {
      next_offset: (offset + limit).toString(),
      cache_time: 86400,
    });
  } catch (err) {
    console.error("error occured while handling inline query", err);
  }
});

bot.action(/ans:(.+)/, async (ctx) => {
  let [notficationId, eventType, id, type] = ctx.match[1].split(":");
  try {
    const notfication = await Notification.findById(notficationId);
    const subscription = notfication.notificationSetting;
    changeNotificationSetting(subscription, eventType as EventType);

    await notfication.save();
    const keyboard = getNotificationSettingButtons(
      subscription,
      (eventType: EventType) => {
        return `ans:${notfication.id}${eventType}:${id}:${type}`;
      }
    );

    keyboard.push([
      { text: "Back", callback_data: `chosen_inline_result:${type}:${id}` },
    ]);
    let answerKeyboard: InlineKeyboardMarkup = {
      inline_keyboard: keyboard,
    };

    await ctx.editMessageReplyMarkup(answerKeyboard);
  } catch (err) {
    console.error("error while editing subscriptioin", err);
  }
});

bot.action(/pch:(.+)/, async (ctx) => {
  const [chatId, type, id] = ctx.match[1].split(":");
  try {
    const chat = await Channel.findOne({ chatId: chatId });
    let name: string;

    if (type.toLowerCase() === "league") {
      const league = await getLeague(id);
      name = league.league.name;
    }
    if (type.toLowerCase() === "club") {
      const club = await getClub(id);

      name = club.team.name;
    }
    let subscription: NotificationSetting;

    const notfication = await Notification.findOneAndUpdate(
      {
        channel: chat.id,
        notId: id.trim(),
        type: type.toLowerCase(),
      },
      {
        channel: chat.id,
        targetType: "channel",
        notId: id.trim(),
        type: type.trim(),
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    subscription = notfication.notificationSetting;
    const keyboard = getNotificationSettingButtons(
      subscription,
      (eventType: EventType) => {
        return `ans:${notfication.id}:${eventType}:${id}:${type}`;
      }
    );

    keyboard.push([
      { text: "Back", callback_data: `chosen_inline_result:${type}:${id}` },
    ]);
    let answerKeyboard: InlineKeyboardMarkup = {
      inline_keyboard: keyboard,
    };

    await ctx.editMessageText(
      `${name} added to 📢 ${chat.title} (@${chat.username}) \n\n🔔 Select the live football events of <b>${name}</b> matches you want to receive`,
      {
        parse_mode: "HTML",
        reply_markup: answerKeyboard,
      }
    );
  } catch (err) {
    console.error("error while editing subscriptioin", err);
  }
});

bot.action(/channel:(.+)/, async (ctx) => {
  const [channelId] = ctx.match[1].split(":");
  const channel = await Channel.findById(channelId);
  const keyboard: InlineKeyboardButton[][] = [
    [{ text: "subscriptions", callback_data: `subscriptions:${channelId}` }],
    [{ text: "Notfication Setting", callback_data: `notSetting:${channelId}` }],
    [{ text: "Back", callback_data: "mychannels" }],
  ];

  await ctx.editMessageText(`${channel.title}`, {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
});

bot.action(/subscriptions:(.+)/, async (ctx) => {
  const [channelId] = ctx.match[1].split(":");
  await getSubscriptions(channelId, ctx);
});
bot.action(/notSetting:(.+)/, async (ctx) => {
  const [channelId, eventType] = ctx.match[1].split(":");
  const channel = await Channel.findById(channelId);
  changeNotificationSetting(
    channel.notificationSetting,
    eventType as EventType
  );
  await channel.save();

  const keyboard = getNotificationSettingButtons(
    channel.notificationSetting,
    (eventType: EventType) => {
      return `notSetting:${channelId}:${eventType}`;
    }
  );

  keyboard.push([{ text: "Back", callback_data: `channel:${channel.id}` }]);

  await ctx.editMessageText(`⚙️ $${channel.title} (@${channel.username}):`, {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
});
bot.action(/subNotSetting:(.+)/, async (ctx) => {
  const [notificationId, eventType] = ctx.match[1].split(":");

  let notfication = await Notification.findById(notificationId);
  if (eventType === "remove") {
    await Notification.findByIdAndDelete(notificationId);
    return await getSubscriptions(notfication.channel.toString(), ctx);
  }

  const channel = await Channel.findById(notfication.channel);

  changeNotificationSetting(
    notfication.notificationSetting,
    eventType as EventType
  );
  await notfication.save();

  let name: string;
  if (notfication.type === "club")
    name = (await getClub(notfication.notId)).team.name;
  else if (notfication.type === "league")
    name = (await getLeague(notfication.notId)).league.name;

  const keyboard = getNotificationSettingButtons(
    notfication.notificationSetting,
    (eventType: EventType) => {
      return `subNotSetting:${notificationId}:${eventType}`;
    }
  );

  keyboard.push([
    { text: "🗑 Delete", callback_data: `subscriptions:${channel.id}:remove` },
  ]);
  keyboard.push([
    { text: "Back", callback_data: `subscriptions:${channel.id}` },
  ]);

  await ctx.editMessageText(
    `⚙️ ${name}: ${channel.title} (@${channel.username})`,
    {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    }
  );
});
bot.action(/remove:(.+)/, async (ctx) => {
  const [channelId] = ctx.match[1].split(":");
});

bot.action(/countries:(.+)/, async (ctx) => {
  const [offset] = ctx.match[1].split(":");
  const keyboard: InlineKeyboardButton[][] = [];

  const page = parseInt(offset);
  const perPage = 16;
  for (
    let index = page * perPage;
    index < Math.min(page * perPage + perPage, countries.length);
    index++
  ) {
    const country = countries[index];
    if (index % 4 === 0) keyboard.push([]);

    keyboard[keyboard.length - 1].push(
      Markup.button.switchToCurrentChat(
        country.name,
        `#Clubs ${country.name}`,
        false
      )
    );
  }

  keyboard.push([]);

  if (page > 0)
    keyboard[keyboard.length - 1].push({
      text: "⬅️",
      callback_data: `countries:${page - 1}`,
    });
  if (page * perPage < countries.length - 1)
    keyboard[keyboard.length - 1].push({
      text: "➡️",
      callback_data: `countries:${page + 1}`,
    });

  ctx.reply("Pick a country:", {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
});

async function getSubscriptions(channelId: string, ctx) {
  const subscriptions = await Notification.find({ channel: channelId });
  const channel = await Channel.findById(channelId);
  const keyboard: InlineKeyboardButton[][] = await Promise.all(
    subscriptions.map(async (subscription) => {
      let name: string;
      if (subscription.type === "club")
        name = (await getClub(subscription.notId)).team.name;
      else if (subscription.type === "league")
        name = (await getLeague(subscription.notId)).league.name;

      return [
        {
          text: `${name} (${subscription.type})`,
          callback_data: `subNotSetting:${subscription.id}`,
        },
      ];
    })
  );

  keyboard.push([{ text: "Back", callback_data: `channel:${channelId}` }]);
  await ctx.editMessageText(
    `${channel.title} (@${channel.username}) subscriptions`,
    {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    }
  );
}
