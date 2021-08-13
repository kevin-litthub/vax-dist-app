import { Producer } from 'kafkajs';
import { isNil } from 'ramda';
import { Connection } from 'typeorm';
import { KafkaConfigurations } from '../config/kafka.config';
import CustomerServices from './customer.services';

export class KafkaConsumers {
  public static async init(kafka: KafkaConfigurations, connection: Connection): Promise<void> {
    try {
      const kafkaConsumersHandlers = new KafkaConsumersHandlers();
      const consumer = kafka.kafka.consumer({ groupId: 'customer-group' });
      const consumerObj = await consumer.connect();
      console.log('consumerObj => ', consumerObj);
      await consumer.subscribe({ topic: 'create.shipment.customer' });
      await consumer.subscribe({ topic: 'send.shipment.customer' });
      await consumer.subscribe({ topic: 'accept.shipment.customer' });
      await consumer.subscribe({ topic: 'reject.shipment.customer' });
      await consumer.subscribe({ topic: 'approved.shipment.manufacturer.ack' });
      await consumer.subscribe({ topic: 'approved.shipment.authority.ack' });
      await consumer.subscribe({ topic: 'reject.shipment.manufacturer.ack' });
      await consumer.subscribe({ topic: 'reject.shipment.authority.ack' });
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          console.log({
            topic: topic,
            message: message?.value?.toString(),
          });
          if (isNil(message.value)) throw new Error('The message from kafka is null');
          const messageString = message?.value?.toString();
          const messageObj = JSON.parse(messageString || '');
          await kafkaConsumersHandlers.validateMessageFromKafka(topic, messageObj, connection, kafka);
        },
      });
    } catch (error) {
      console.error(`Error on kafka consumer - ${error}`);
    }
  }
}
export class KafkaConsumersHandlers {
  private producer: Producer;
  private customerServices: CustomerServices;

  constructor() {
    this.customerServices = new CustomerServices();
  }

  public async validateMessageFromKafka(
    topic: string,
    messageObj: Record<string, any>,
    connection: Connection,
    kafka: KafkaConfigurations,
  ): Promise<void> {
    // create a method called validateMessageFromKafka to validate the message object;
    // if the message have flaws, then reject the shipment and send an ack;
    // else create a method called handleMessageFromKafka to send ack;
  }
}
