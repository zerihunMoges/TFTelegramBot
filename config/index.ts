require("dotenv").config();

export const config = {
  webApp: process.env.WEBAPPURL,
  webUrl: process.env.WEBURL,
  apiUrl: process.env.APIURL,
  mongoUrl: process.env.DATABASEURL,
  botToken: process.env.BOTTOKEN,
  channelBotToken: process.env.CHANNELBOTTOKEN,
  port: parseInt(process.env.PORT || "8001"),
  webHookDomain: process.env.BOTWEBHOOK || "",
  enc: process.env.ENC,
  sig: process.env.SIG,
  MQUrl: process.env.MQURL,
};
