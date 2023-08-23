import mongoose, { Schema } from "mongoose";
import { type } from "os";

export interface IChannel {
  title: string;
  chatId: number;
  username: string;
  users: mongoose.Types.ObjectId[];
  postFormats?: PostFormats;
}

export interface PostFormats {
  [_index: string]: string;
}

export interface NotificationSetting {
  goal?: boolean;
  redCard?: boolean;
  var?: boolean;
  yellowCard?: boolean;
  lineups?: boolean;
  substitution?: boolean;
  active?: boolean;
}

const NotificationSettingSchema = new Schema({
  goal: {
    type: Boolean,
    default: true,
  },
  redCard: {
    type: Boolean,
    default: false,
  },
  var: {
    type: Boolean,
    default: false,
  },
  yellowCard: {
    type: Boolean,
    default: false,
  },
  lineups: {
    type: Boolean,
    default: false,
  },
  substitution: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: false,
  },
});
const PostFormatsSchema = new Schema({
  goal: {
    type: String,
    default:
      "<b>{time}+{extra}' Goal for {team},</b>\n\n{hometeam} {homegoal} - {awaygoal} {awayteam}\n\n<b>Goal</b> - {player}\n<b>Assist</b> - {assist}",
  },
  "own goal": {
    type: String,
    default:
      "<b>{time}+{extra}' Goal for {team},</b>\n\n{hometeam} {homegoal} - {awaygoal} {awayteam}\n\n<b>Own Goal</b> - {player}",
  },
  penalty: {
    type: String,
    default:
      "<b>{time}+{extra}' Goal for {team},</b>\n\n{hometeam} {homegoal} - {awaygoal} {awayteam}\n\n<b>Goal</b> - {player} (Penalty)",
  },
  subst: {
    type: String,
    default:
      "<b>{time}+{extra}',</b>  Substitution by {team}, {in} replaces {out}.",
  },
  "yellow card": {
    type: String,
    default: "<b>{time}+{extra}',  🟨 Yellow card, {player} ({team})",
  },
  "red card": {
    type: String,
    default: "<b>{time}',  🟥 Red card, {player} ({team})",
  },
  "missed penalty": {
    type: String,
    default:
      "{time}' Penalty Missed, {player} ({team})\n\n{hometeam} {homegoal} - {awaygoal} {awayteam}",
  },
});

const ChannelSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  chatId: {
    type: String || Number,
    unique: true,
    required: true,
  },
  username: {
    type: String,
  },
  userChatIds: {
    type: [Number],
    required: true,
  },
  postFormats: {
    type: PostFormatsSchema,
    default: {
      goal: "<b>{time}' Goal for {team},</b>\n\n{hometeam} {homegoal} - {awaygoal} {awayteam}\n\n<b>Goal</b> - {player}\n<b>Assist</b> - {assist}",

      "own goal":
        "<b>{time}' Goal for {team},</b>\n\n{hometeam} {homegoal} - {awaygoal} {awayteam}\n\n<b>Own Goal</b> - {player}",

      penalty:
        "<b>{time}' Goal for {team},</b>\n\n{hometeam} {homegoal} - {awaygoal} {awayteam}\n\n<b>Goal</b> - {player} (Penalty)\n{comment}",

      subst: "<b>{time}',</b>  Substitution by {team}, {in} replaces {out}.",

      "yellow card": "<b>{time}'</b>,  🟨 Yellow card, {player} ({team})",

      "red card": "<b>{time}'</b>,  🟥 Red card, {player} ({team})",
      var: "<b>{time}'</b> 💻 Var, {team}. {detail} - {comment}",
      "missed penalty":
        "{time}+{extra}' Penalty Missed, {player} ({team})\n\n{hometeam} {homegoal} - {awaygoal} {awayteam}",
    },
  },

  notificationSetting: {
    type: NotificationSettingSchema,
    default: NotificationSettingSchema,
  },
});

export const Channel = mongoose.model<IChannel>("Channel", ChannelSchema);
