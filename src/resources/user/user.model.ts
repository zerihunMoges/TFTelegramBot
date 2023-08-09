import mongoose, { Schema } from "mongoose";

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

export const User = mongoose.model<IUser>("User", UserSchema);
