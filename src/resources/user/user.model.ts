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
}

const NotificationSettingSchema = new Schema<NotificationSetting>({
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
});

export const defaultNotificationSetting = {
  goal: true,
  redCard: false,
  var: false,
  yellowCard: false,
  lineups: false,
  substitution: false,
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
