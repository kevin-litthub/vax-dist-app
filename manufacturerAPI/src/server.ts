import express from 'express';
import { Connection, createConnection } from 'typeorm';
import { KafkaConfigurations } from './config/kafka.config';
import router from './routers/manufacturer.router';
import { KafkaConsumers } from './services/kafka.consumer.services';

export let connection: Connection;
export let kafka: KafkaConfigurations;

export default class Server {
  private app: express.Application;
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.app = express();
    this.baseUrl = baseUrl;
    this.config();
  }

  private config() {
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  }

  private routerConfig() {
    this.app.use(`${this.baseUrl}`, router);
  }

  public async start(port: number): Promise<void> {
    this.app.listen(port, async () => {
      try {
        kafka = new KafkaConfigurations();
        connection = await createConnection();
        await KafkaConsumers.init(kafka, connection);
        this.routerConfig();
      } catch (error) { }
    });
  }
}
