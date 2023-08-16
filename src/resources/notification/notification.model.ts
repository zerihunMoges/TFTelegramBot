import mongoose from "mongoose";
import { config } from "../../../config";
import encrypt from "mongoose-encryption";
import { User } from "../user/user.model";

export interface IUserNotification {
  user: mongoose.Types.ObjectId;
  type: string;
  notId: string;
}

const UserNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: User,
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
});

export const UserNotification = mongoose.model<IUserNotification>(
  "UserNotification",
  UserNotificationSchema
);
