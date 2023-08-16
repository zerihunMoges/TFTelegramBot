import mongoose, { Schema } from "mongoose";
import encrypt from "mongoose-encryption";
import { config } from "../../../config";

export interface IUser {
  firstName?: string;
  chatId: number | string;
  username?: string;
  isBotConnected?: boolean;
  botToken?: string;
}

const UserSchema = new mongoose.Schema({
  firstName: {
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
  isBotConnected: {
    type: Boolean,
    default: false,
    required: true,
  },
  botToken: {
    type: String,
  },
});

const encKey = config.enc;
const sigKey = config.sig;
UserSchema.plugin(encrypt, {
  encryptionKey: encKey,
  signingKey: sigKey,
  encryptedFields: ["botToken"],
});

export const User = mongoose.model<IUser>("User", UserSchema);
