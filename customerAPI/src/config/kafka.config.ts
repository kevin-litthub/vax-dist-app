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
        clientId: 'vax-dist-app-customer',
        brokers: [`${host}:${port}`],
        connectionTimeout: 15000,
        retry: {
          initialRetryTime: 5000,
          retries: 15,
          maxRetryTime: 30000,
        },
      });
      const adminClient = this.kafka.admin();
      await adminClient.createTopics({
        waitForLeaders: true,
        timeout: 5000,
        topics: [
          { topic: 'accept.shipment.authority' },
          { topic: 'accept.shipment.customer' },
          { topic: 'reject.shipment.authority' },
          { topic: 'reject.shipment.customer' },
          { topic: 'accept.shipment.authority.ack' },
          { topic: 'accept.shipment.customer.ack' },
          { topic: 'reject.shipment.authority.ack' },
          { topic: 'reject.shipment.customer.ack' },
          { topic: 'create.shipment.customer' },
          { topic: 'send.shipment.customer' },
          { topic: 'approved.shipment.customer' },
          { topic: 'block.shipment.customer' },
        ],
      });
    } catch (error) {
      console.error(`Error on kafka producer connect ${error}`);
    }
  }
}
