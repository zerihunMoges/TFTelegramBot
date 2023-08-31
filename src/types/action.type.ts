export type Action = "post" | "put" | "delete";
export type MessageType =
  | "event"
  | "lineup"
  | "FT"
  | "BT"
  | "HT"
  | "AET"
  | "PEN";
export type SubscriptionType = "club" | "league";
export type EventType =
  | "goal"
  | "redCard"
  | "yellowCard"
  | "var"
  | "break"
  | "FT"
  | "lineups"
  | "substitution";
