import { Kafka } from 'kafkajs';
import { DEFAULT_KAFKA_HOST, DEFAULT_KAFKA_PORT } from '../utils/constants';

export class KafkaConfigurations {
  public kafka: Kafka;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      const host = process.env.KAFKA_HOST ? process.env.KAFKA_HOST : DEFAULT_KAFKA_HOST;
      const port = process.env.KAFKA_PORT ? process.env.KAFKA_PORT : DEFAULT_KAFKA_PORT;
      console.log(`kafka config started with ${host}:${port}`);
      this.kafka = new Kafka({
        clientId: 'vax-dist-app',
        brokers: [`${host}:${port}`],
        connectionTimeout: 15000,
        retry: {
          initialRetryTime: 5000,
          retries: 15,
          maxRetryTime: 30000
        }
      });
      const adminClient = this.kafka.admin();
      await adminClient.createTopics({
        waitForLeaders: true,
        timeout: 5000,
        topics: [
          { topic: 'create.shipment.authority' },
          { topic: 'create.shipment.customer' },
          { topic: 'create.shipment.authority.ack' },
          { topic: 'create.shipment.customer.ack' },
          { topic: 'send.shipment.authority' },
          { topic: 'send.shipment.customer' },
          { topic: 'send.shipment.authority.ack' },
          { topic: 'send.shipment.customer.ack' },
        ],
      });
    } catch (error) {
      console.error(`Error on kafka producer connect ${error}`);
    }
  }
}
