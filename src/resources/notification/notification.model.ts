import mongoose from "mongoose";
import { config } from "../../../config";
import encrypt from "mongoose-encryption";
import { User } from "../user/user.model";
import { Channel } from "../channel/channel.model";

export interface INotification {
  user: mongoose.Types.ObjectId;
  type: string;
  notId: string;
}

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: User,
    required: true,
  },
  channel: {
    type: mongoose.Types.ObjectId,
    ref: Channel,
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
