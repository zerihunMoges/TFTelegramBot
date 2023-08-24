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
}

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
