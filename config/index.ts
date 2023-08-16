require("dotenv").config();

export const config = {
  webApp: process.env.WEBAPP,
  apiUrl: process.env.APIURL,
  mongoUrl: process.env.DATABASEURL,
  botToken: process.env.BOTTOKEN || "",
  port: parseInt(process.env.PORT || "8000"),
  webHookDomain: process.env.BOTWEBHOOK || "",
  enc: process.env.ENC,
  sig: process.env.SIG,
};
