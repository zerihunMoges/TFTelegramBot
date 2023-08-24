import { channel } from "diagnostics_channel";
import { Channel, IChannel } from "./channel.model";
import { User } from "../user/user.model";
import { createUser } from "../user/user.service";

export async function addChannel({ chatId, userChatId, username, title }) {
  let user = await User.findOne({ chatId: userChatId });
  if (!user) {
    user = await createUser({ chatId: userChatId });
  }

  const newChannel = await Channel.findOne({ chatId: chatId });
  if (newChannel) {
    if (!newChannel.users.includes(user.id)) newChannel.users.push(user.id);
    newChannel.title = title;
    newChannel.username = username;
    return await newChannel.save();
  }
  return await Channel.create({
    chatId,
    users: [user.id],
    username,
    title,
  });
}
