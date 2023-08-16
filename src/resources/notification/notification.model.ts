import mongoose from "mongoose";
import { config } from "../../../config";
import encrypt from "mongoose-encryption";

export interface IUserNotification {
  chatId: string | number;
  type: string;
  notId: string;
  botToken: string;
}

const UserNotificationSchema = new mongoose.Schema({
  chatId: {
    type: String || Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  notId: {
    type: String,
    required: true,
  },
  botToken: {
    type: String,
    required: true,
  },
});

const encKey = config.enc;
const sigKey = config.sig;
UserNotificationSchema.plugin(encrypt, {
  encryptionKey: encKey,
  signingKey: sigKey,
  encryptedFields: ["botToken"],
});

export const UserNotification = mongoose.model<IUserNotification>(
  "UserNotification",
  UserNotificationSchema
);
