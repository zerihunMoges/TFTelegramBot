// consumer.ts
import { connect, Connection, Channel } from "amqplib";
import { Action } from "../../types/action.type";
import { bot } from "../../channel-bot/bot";
import { Notification } from "../../resources/notification/notification.model";
import { config } from "../../../config";
import { Teams } from "../../types/team.type";
import { Channel as TelegramChannel } from "../../resources/channel/channel.model";
import { pool } from "../connection-pool/connectionpool";

export async function sendMessage(
  message: string,
  chat_id: string,
  type: string,
  updateId,
  action: Action,
  matchId
) {
  try {
    let sentMessage;

    if (action === "post")
      sentMessage = await bot.telegram.sendMessage(chat_id, message, {
        parse_mode: "HTML",
      });
    else if (action === "put") {
      sentMessage = await Notification.findOne({
        type: type,
        chatId: chat_id,
        eventId: updateId,
      });
      sentMessage = await bot.telegram.editMessageText(
        chat_id,
        parseInt(sentMessage.messageId),
        null,
        message,
        {
          parse_mode: "HTML",
        }
      );
    }
    await Notification.findOneAndUpdate(
      {
        type: type,
        chatId: chat_id,
        eventId: updateId,
      },
      {
        type,
        chatId: chat_id,
        eventId: updateId,
        messageId: sentMessage.message_id,
      },
      {
        upsert: true,
      }
    );
  } catch (err) {
    if (
      err.response &&
      err.response.parameters &&
      err.response.parameters.retry_after
    ) {
      console.error("retry after", err.response.parameters.retry_after);
      await new Promise((resolve) =>
        setTimeout(resolve, err.response.parameters.retry_after * 1000)
      );

      await sendMessage(message, chat_id, type, updateId, action, matchId);
    }
  }
}
export async function receiveUpdates() {
  const queue = "updates";
  let connection: Connection;
  try {
    connection = await pool.acquire();
    const channel: Channel = await connection.createChannel();

    await channel.assertQueue(queue);
    await channel.consume(queue, async (msg) => {
      if (msg) {
        const { message, user } = JSON.parse(msg.content.toString());
        console.log(message.type);
        let type: string;
        let data;
        let matchId: string | number;
        let action: Action;
        let teams: Teams;
        ({ teams, action, matchId, type, data } = message);

        const chat_id = user;
        const telegramChannel = await TelegramChannel.findOne({
          chatId: chat_id,
        });

        if (!telegramChannel) return;

        let update = type;
        let subscriptionStatus = true;
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

        if (type === "event" && data) {
          data = data as Event;
          let eventFormattedMessage =
            telegramChannel.postFormats[data.detail?.toLowerCase()] ||
            telegramChannel.postFormats[data.type?.toLowerCase()];

          const values = {
            time: data?.time?.elapsed,
            extra: data?.time?.extra ? data?.time?.extra : "",
            team: data?.team?.name,
            hometeam: teams?.home?.name,
            homegoal: data?.goals?.home,
            awaygoal: data?.goals?.away,
            in: data?.player?.name ? data?.player?.name : "",
            out: data?.assist?.name ? data?.assist?.name : "",
            awayteam: teams?.away?.name,
            player: data?.player?.name ? data?.player?.name : "",
            assist: data?.assist?.name ? data?.assist?.name : "",
          };

          const update = eventFormattedMessage?.replace(
            /{([^{}]*)}/g,
            (a, b) => {
              const r = values[b];
              return r !== null && r !== undefined ? r : "";
            }
          );

          if (update && update.length > 0) {
            await sendMessage(
              update + `\n\nhttp://t.me/TeleFootballBot/app`,
              chat_id,
              type,
              data?.id,
              action,
              matchId
            );
          }
        } else if (type === "lineup" && subscriptionStatus) {
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
          const message =
            `TeamNews 📋\n\n${homeFormated}\n\n${awayFormated}` +
            `\n\nhttp://t.me/TeleFootballBot/app`;
          await sendMessage(message, chat_id, type, data?.id, action, matchId);
        } else if (type === "FT") {
          const message = `FT:</b>\n\n${teams.home.name} ${data?.goals?.home} - ${data?.goals?.away} ${teams.away.name}\n`;
        }

        channel.ack(msg);
      }
    });
  } catch (err) {
    console.error(
      "error occurred while consumin channel messages, retrying after one minute",
      err
    );
    const minute = 60000;
    await new Promise((resolve) => setTimeout(resolve, minute));

    receiveUpdates();
  }
}
