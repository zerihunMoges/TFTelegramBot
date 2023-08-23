import mongoose from "mongoose";

export interface IMessage {
  messageId: string;
  user: mongoose.Types.ObjectId;
  channel: mongoose.Types.ObjectId;
  messageType: string;
  telegramMessageId: number;
}

const MessageSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Types.ObjectId,
    },
    channel: {
      type: mongoose.Types.ObjectId,
    },
    telegramMessageId: {
      type: Number,
      required: true,
    },
    messageType: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
