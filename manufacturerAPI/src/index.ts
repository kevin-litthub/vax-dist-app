import 'reflect-metadata';

import dotenv from 'dotenv';
import { join } from 'path';
import Server from './server';
import { DEFAULT_BASE_PATH_URL, DEFAULT_PORT } from './utils/constants';

async function main() {
  process.env.NODE_ENV ? dotenv.config({ path: join(process.cwd(), `.env.${process.env.NODE_ENV}`) }) : dotenv.config();
  const port: number = parseInt(process.env.PORT || DEFAULT_PORT);
  const basePathUrl: string = process.env.BASE_PATH_URL || DEFAULT_BASE_PATH_URL;

  console.log(port);
  console.log(basePathUrl);

  new Server(basePathUrl)
    .start(port)
    .then(() => {
      console.log(`The server is up and running at ${port}`);
    })
    .catch((error) => {
      console.error(`Occur an error initializing the server - ${error}`);
    });
}

main();
