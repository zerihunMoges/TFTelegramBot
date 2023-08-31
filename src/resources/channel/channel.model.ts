import mongoose, { Schema } from "mongoose";

export interface IChannel {
  title: string;
  chatId: number;
  username: string;
  users: mongoose.Types.ObjectId[];
  postFormats?: PostFormats;
  active: boolean;
  notificationSetting: NotificationSetting;
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
  break?: boolean;
  FT?: boolean;
}

const NotificationSettingSchema = new Schema<NotificationSetting>({
  goal: Boolean,
  redCard: Boolean,
  var: Boolean,
  yellowCard: Boolean,
  lineups: Boolean,
  substitution: Boolean,
  break: Boolean,
  FT: Boolean,
});

export const defaultNotificationSetting = {
  goal: true,
  redCard: true,
  var: true,
  yellowCard: false,
  lineups: true,
  substitution: false,
  break: true,
  FT: true,
};
export const defaultPostFormats = {
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
};

export const PostFormatsSchema = new Schema({
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
  var: {
    type: String,
    default: "<b>{time}'</b> 💻 Var, {team}. {detail} - {comment}",
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
    type: Number,
    unique: true,
    required: true,
  },
  username: {
    type: String,
  },
  users: {
    type: [mongoose.Types.ObjectId],
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  postFormats: {
    type: PostFormatsSchema,
    default: defaultPostFormats,
  },

  notificationSetting: {
    type: NotificationSettingSchema,
    default: defaultNotificationSetting,
  },
});

export const Channel = mongoose.model<IChannel>("Channel", ChannelSchema);
