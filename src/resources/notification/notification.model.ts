import mongoose from "mongoose";
import { config } from "../../../config";
import encrypt from "mongoose-encryption";
import { User } from "../user/user.model";
import { Channel } from "../channel/channel.model";

export interface INotification {
  _id: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  channel?: mongoose.Types.ObjectId;
  targetType: "channel" | "user";
  type: string;
  notId: string;
}

const NotificationSchema = new mongoose.Schema({
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
  },
  type: {
    type: String,
    enum: ["club", "league"],
    required: true,
  },
  notId: {
    type: String,
    required: true,
  },
});

export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
