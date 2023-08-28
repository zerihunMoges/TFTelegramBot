import * as crypto from "crypto";
import { config } from "../../config";

function veriftyDataIsFromTelegram(data, hash) {
  const botToken = config.botToken;
  const encoder = new TextEncoder();
  data = Object.fromEntries(new URLSearchParams(data));
  const checkString = Object.keys(data)
    .filter((key) => key !== "hash")
    .map((key) => `${key}=${data[key]}`)
    .sort()
    .join("\n");

  console.log(checkString);

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex");
  return calculatedHash === hash;
}
