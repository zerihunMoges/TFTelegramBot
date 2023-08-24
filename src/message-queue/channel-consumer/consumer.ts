// consumer.ts
import { Channel, ConsumeMessage } from "amqplib";
import { Action, MessageType } from "../../types/action.type";
import { bot as channelBot } from "../../channel-bot/bot";
import {
  INotification,
  Notification,
} from "../../resources/notification/notification.model";
import { Teams } from "../../types/team.type";
import {
  IChannel,
  PostFormats,
  PostFormatsSchema,
  Channel as TelegramChannel,
  defaultPostFormats,
} from "../../resources/channel/channel.model";
import { channelPool } from "../connection-pool/channelPool";
import { Telegraf } from "telegraf";
import mongoose from "mongoose";
import { IUser, User } from "../../resources/user/user.model";
import { error } from "console";
import { IMessage, Message } from "../../resources/notification/message.model";
import { Message as TelegrafMessage } from "telegraf/types";
import { Event } from "../../types/event.type";
import { config } from "../../../config";

interface Stat {
  home: number | string | null;
  away: number | string | null;
}
interface FormattedStatistic {
  [statType: string]: Stat;
}

async function editTelegramMessage(
  message: string,
  telegramMessageId: number,
  chatId: number,
  type: MessageType,
  notification: mongoose.Types.ObjectId,
  messageId: number,
  bot: Telegraf
) {
  const sentMessage = await bot.telegram.editMessageText(
    chatId,
    telegramMessageId,
    null,
    message,
    {
      parse_mode: "HTML",
    }
  );

  await saveMessage(type, notification, messageId, telegramMessageId, message);

  return sentMessage;
}

async function sendTelegramMessage(
  message: string,
  chatId: number,
  type: MessageType,
  notification: mongoose.Types.ObjectId,
  messageId: number,
  bot: Telegraf
) {
  const sentMessage = await bot.telegram.sendMessage(chatId, message, {
    parse_mode: "HTML",
  });

  await saveMessage(
    type,
    notification._id,
    messageId,
    sentMessage.message_id,
    message
  );
  return sentMessage;
}

async function deleteTelegramMessage(
  messageId: mongoose.Types.ObjectId,
  telegramMessageId: number,
  chatId: number,
  bot: Telegraf
) {
  const sentMessage = await bot.telegram.deleteMessage(
    chatId,
    telegramMessageId
  );
  await Message.findByIdAndDelete(messageId);

  return sentMessage;
}

async function saveMessage(
  messageType: MessageType,
  notification: mongoose.Types.ObjectId,
  messageId: number,
  telegramMessageId: number,
  message: string
) {
  const finder: any = { messageType, messageId, notification };

  return await Message.findOneAndUpdate(
    finder,
    {
      messageType,
      notification,
      messageId,
      telegramMessageId,
      message,
    },
    {
      upsert: true,
    }
  );
}

async function sendUserMessage(
  message: string,
  type: MessageType,
  messageId: number,
  action: Action,
  notification: INotification
) {
  try {
    const user = await User.findById(notification.user);
    const bot = new Telegraf(user.botToken);

    if (action === "post") {
      return await sendTelegramMessage(
        message,
        user.chatId,
        type,
        notification._id,
        messageId,
        bot
      );
    }

    const savedMessage = await Message.findOne({
      messageType: type,
      user: notification.user,
      messageId,
    });
    if (action === "put" && savedMessage) {
      return await editTelegramMessage(
        message,
        savedMessage.telegramMessageId,
        user.chatId,
        type,
        notification._id,
        messageId,
        bot
      );
    }

    if (action === "delete" && savedMessage) {
      return await deleteTelegramMessage(
        savedMessage.id,
        savedMessage.telegramMessageId,
        user.chatId,
        bot
      );
    }
  } catch (err) {
    if (err.code === 429 && err.response?.parameters?.retry_after) {
      console.log("retry", err.response.parameters.retry_after);
      await new Promise((resolve) =>
        setTimeout(resolve, err.response.parameters.retry_after * 1000)
      );

      await sendUserMessage(message, type, messageId, action, notification);
    }

    if (err.code === 403) {
      console.error("send message failed with status code 403");
    }
  }
}

async function sendChannelMessage(
  message: string,
  type: MessageType,
  messageId: number,
  action: Action,
  notification: INotification
) {
  try {
    console.log("sending channel message", type, action);
    const channel = await TelegramChannel.findById(notification.channel);
    const bot = channelBot;
    let sentMessage: TelegrafMessage.TextMessage;

    if (action === "post") {
      return await sendTelegramMessage(
        message,
        channel.chatId,
        type,
        notification._id,
        messageId,
        bot
      );
    }

    const savedMessage = await Message.findOne({
      messageType: type,
      user: notification.user,
      messageId,
    });
    if (action === "put" && savedMessage) {
      return await editTelegramMessage(
        message,
        savedMessage.telegramMessageId,
        channel.chatId,
        type,
        notification._id,
        messageId,
        bot
      );
    }

    if (action === "delete" && savedMessage) {
      await deleteTelegramMessage(
        savedMessage.id,
        savedMessage.telegramMessageId,
        channel.chatId,
        bot
      );
    }
  } catch (err) {
    if (err.code === 429 && err.response?.parameters?.retry_after) {
      console.log("retry", err.response.parameters.retry_after);
      await new Promise((resolve) =>
        setTimeout(resolve, err.response.parameters.retry_after * 1000)
      );

      await sendChannelMessage(message, type, messageId, action, notification);
    }

    if (err.code === 403) {
      console.error("send message failed with status code 403");
    }
  }
}

function formatEventMessage(data: any, teams: any, postFormat: string) {
  const values = {
    time: data.time.elapsed,
    extra: data.time.extra ? data.time.extra : "",
    team: data.team.name,
    hometeam: teams.home.name,
    homegoal: data.goals.home,
    awaygoal: data.goals.away,
    in: data.player.name ? data.player.name : "",
    out: data.assist.name ? data.assist.name : "",
    awayteam: teams.away.name,
    player: data.player.name ? data.player.name : "",
    assist: data.assist.name ? data.assist.name : "",
  };

  const message = postFormat.replace(/{([^{}]*)}/g, (a, b) => {
    const r = values[b];
    return r !== null && r !== undefined ? r : "";
  });

  return message;
}

function formatLineup(data) {
  const [home, away] = data;

  const { team, formation, startXI, substitutes } = home;
  const {
    team: awayTeam,
    formation: awayFormation,
    startXI: awayStartXI,
    substitutes: awaySubs,
  } = away;

  const homeFormated =
    `${team?.name} StartXI: ${formation && formation}\n\n` +
    startXI.map((player) => player.player.name).join("; ");
  const awayFormated =
    `${awayTeam?.name} StartXI: ${awayFormation && awayFormation}\n\n` +
    awayStartXI.map((player) => player.player.name).join("; ");

  const stringMessage =
    `TeamNews 📋\n\n${homeFormated}\n\n${awayFormated}` +
    `\n\nhttp://t.me/TeleFootballBot/app`;

  return stringMessage;
}

async function getPostFormat(user: INotification, data: Event) {
  let postFormats: PostFormats = defaultPostFormats;
  if (user.targetType === "channel") {
    const telegramChannel: IChannel = await TelegramChannel.findById({
      _id: user.channel,
    });
    if (!telegramChannel) return;

    postFormats = telegramChannel.postFormats;
  }
  const postFormat: string =
    postFormats[data.detail?.toLowerCase()] ||
    postFormats[data.type?.toLowerCase()];

  return postFormat;
}

function formatStats(stats, teams: Teams) {
  const pickedStats = [
    { type: "Ball Possession", name: "Possession", score: 0 },
    { type: "Passes %", name: "Pass Accuracy" },
    { type: "Passes accurate", name: "Accurate Passes" },
    { type: "expected_goals", name: "XG - Expected Goals", score: -1 },
  ];

  try {
    const formatedStats: FormattedStatistic = stats.reduce(
      (result: FormattedStatistic, { team, statistics }) => {
        statistics?.forEach(({ type, value }) => {
          if (!(type in result)) {
            result[type] = {
              home: null,
              away: null,
            };
          }

          result[type][team.id === teams.home.id ? "home" : "away"] = value;
        });
        return result;
      },
      {}
    );

    const selectedStats = pickedStats
      .map((pick) => {
        if (
          pick.type in formatedStats &&
          formatedStats[pick.type].home &&
          formatedStats[pick.type].away
        ) {
          return `${pick.name}: ${formatedStats[pick.type].home} - ${
            formatedStats[pick.type].away
          }\n`;
        }
      })
      .filter((stat) => stat)
      .join("");

    console.log(selectedStats);

    return selectedStats;
  } catch (err) {
    console.error("error occured while formating stats", err);
  }

  return "";
}

async function handleMessage(msg: ConsumeMessage, channel: Channel) {
  try {
    if (msg) {
      console.log("got message");
      const { message, user }: { message: any; user: INotification } =
        JSON.parse(msg.content.toString());

      let type: MessageType;
      let data: any;
      let matchId: string | number;
      let action: Action;
      let teams: Teams;
      ({ teams, action, matchId, type, data } = message);

      // data.type?.toLowerCase() === "goal"
      //   ? subscription.goal
      //   : data.type?.toLowerCase() === "subst"
      //   ? subscription.substitution
      //   : data.detail?.toLowerCase() === "yellow card"
      //   ? subscription.yellowCard
      //   : data.detail?.toLowerCase() === "red card"
      //   ? subscription.redCard
      //   : data.type?.toLowerCase() === "var"
      //   ? subscription.var
      //   : type.toLowerCase() === "lineup" && subscription.lineups;
      let stringMessage: string;
      if (type === "event" && data) {
        const postFormat = await getPostFormat(user, data);
        stringMessage =
          postFormat && formatEventMessage(data, teams, postFormat);
      } else if (type === "lineup") {
        stringMessage = formatLineup(data);
      } else if (type === "FT") {
        const stats = data.statistics;
        const someStats = stats ? formatStats(stats, teams) + "\n\n" : "";
        stringMessage = `FT:\n\n${teams.home.name} ${data.goals.home} - ${data.goals.away} ${teams.away.name}\n\n${someStats}${config.webApp}`;
      }

      if (stringMessage || action === "delete") {
        if (user.targetType === "channel")
          await sendChannelMessage(stringMessage, type, data.id, action, user);
        else if (user.targetType === "user")
          await sendUserMessage(stringMessage, type, data.id, action, user);
      }

      channel.ack(msg);
    }
  } catch (err) {
    console.error("error handling message", err);
  }
}

export async function consumeMessages(queue: "channel" | "user") {
  let channel: Channel;
  try {
    channel = await channelPool.acquire();
    console.log("start ", queue);
    await channel.consume(queue, async (msg) => handleMessage(msg, channel));
  } catch (err) {
    console.log("error occurred", err);
  } finally {
    if (channel) channelPool.release(channel);
  }
}
