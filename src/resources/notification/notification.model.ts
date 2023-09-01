import mongoose, { Schema } from "mongoose";
import { config } from "../../../config";
import encrypt from "mongoose-encryption";
import { User } from "../user/user.model";
import { Channel } from "../channel/channel.model";

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

export interface INotification {
  _id: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  channel?: mongoose.Types.ObjectId;
  targetType: "channel" | "user";
  type: string;
  notId: string;
  notificationSetting: NotificationSetting;
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

export const onlyResultNotificationSetting = {
  goal: false,
  redCard: false,
  var: false,
  yellowCard: false,
  lineups: true,
  substitution: false,
  break: false,
  FT: true,
};
const NotificationSchema = new Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  channel: {
    type: mongoose.Types.ObjectId,
    ref: "Channel",
  },
  targetType: {
    type: String,
    enum: ["user", "channel"],
    required: true,
    default: "user",
  },
  type: {
    type: String,
    enum: ["club", "league"],
    required: true,
    default: "club",
  },
  notId: {
    type: String,
    required: true,
  },
  notificationSetting: {
    type: NotificationSettingSchema,
    default: defaultNotificationSetting,
  },
});

export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
