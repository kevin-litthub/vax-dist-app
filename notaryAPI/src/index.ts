import "reflect-metadata";

import dotenv from "dotenv";
import { join } from "path";
import express from "express";
import { DEFAULT_BASE_PATH_URL, DEFAULT_PORT } from "./utils/constants";
import router from "./routers/notary.router";
import { Connection, createConnection } from "typeorm";

export let connection: Connection;

async function main() {
  process.env.NODE_ENV
    ? dotenv.config({
        path: join(process.cwd(), `.env.${process.env.NODE_ENV}`),
      })
    : dotenv.config();

  const port: number = parseInt(process.env.PORT || DEFAULT_PORT);
  const basePathUrl: string =
    process.env.BASE_PATH_URL || DEFAULT_BASE_PATH_URL;

  const app: express.Application = express();
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(`${basePathUrl}`, router);

  await app.listen(port, async () => {
    try {
      connection = await createConnection();
    } catch {}
    console.log(`Notary service runs at ${port}`);
  });
}

main();
