import mongoose from "mongoose";

export interface IMessage {
  messageId: string;
  notification: mongoose.Types.ObjectId;
  messageType: string;
  telegramMessageId: number;
  message: string;
}

const MessageSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true,
    },
    notification: {
      type: mongoose.Types.ObjectId,
      ref: "Notification",
      required: true,
    },
    telegramMessageId: {
      type: Number,
      required: true,
    },
    messageType: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
