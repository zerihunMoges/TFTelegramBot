import mongoose, { Schema } from "mongoose";
import encrypt from "mongoose-encryption";
import { config } from "../../../config";

export interface IUser {
  firstName?: string;
  chatId: number;
  username?: string;
  active?: boolean;
  isBotConnected?: boolean;
  botToken?: string;
  notificationSetting?: NotificationSetting;
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

const UserSchema = new mongoose.Schema(
  {
    firstName: {
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
    active: {
      type: Boolean,
      default: true,
    },
    isBotConnected: {
      type: Boolean,
      default: false,
      required: true,
    },
    botToken: {
      type: String,
    },
    notificationSetting: {
      type: NotificationSettingSchema,
      default: defaultNotificationSetting,
    },
  },
  { timestamps: true }
);

const encKey = config.enc;
const sigKey = config.sig;
UserSchema.plugin(encrypt, {
  encryptionKey: encKey,
  signingKey: sigKey,
  encryptedFields: ["botToken"],
});

export const User = mongoose.model<IUser>("User", UserSchema);
