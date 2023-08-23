import { Connection, connect } from "amqplib";
import { createPool } from "generic-pool";
import { config } from "../../../config";

const opts = {
  max: 2,
  min: 1,
};
const factory = {
  create: async () => {
    const connection = await connect(config.MQUrl);
    return connection;
  },
  destroy: (connection: Connection) => {
    return connection.close();
  },
};
const pool = createPool(factory, opts);
const cleanup = async () => {
  await pool.drain();
  await pool.clear();
};

export { pool, cleanup };
