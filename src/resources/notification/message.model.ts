import mongoose from "mongoose";

export interface IMessage {
  eventId: string;
  chatId: string | number;
  type: string;
  messageId: number;
}

const MessageSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
  },
  chatId: {
    type: String || Number,
    required: true,
  },

  messageId: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
