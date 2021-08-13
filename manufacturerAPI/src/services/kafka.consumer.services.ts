import { isNil } from 'ramda';
import { Connection } from 'typeorm';
import { KafkaConfigurations } from '../config/kafka.config';
import Message, { MessagePayload } from '../entities/message.entity';
import Shipment from '../entities/shipment.entity';
import { MessageType } from '../utils/enums/message.enum';
import { callNotaryService } from '../utils/helperFunctions';

export class KafkaConsumers {
  public static async init(kafka: KafkaConfigurations, connection: Connection): Promise<void> {
    try {
      const kafkaConsumersHandlers = new KafkaConsumersHandlers();
      const consumer = kafka.kafka.consumer({ groupId: 'manufacturer-group' });
      await consumer.connect();
      await consumer.subscribe({ topic: 'create.shipment.authority.ack' });
      await consumer.subscribe({ topic: 'create.shipment.customer.ack' });
      await consumer.subscribe({ topic: 'send.shipment.authority.ack' });
      await consumer.subscribe({ topic: 'send.shipment.customer.ack' });
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          console.log({
            topic: topic,
            message: message?.value?.toString(),
          });
          if (isNil(message.value)) throw new Error('The message from kafka is null');
          const messageString = message?.value?.toString();
          const messageObj = JSON.parse(messageString || '');
          await kafkaConsumersHandlers.handleMessageFromKafka(topic, messageObj, connection);
        },
      });
    } catch (error) {
      console.error(`Error on kafka consumer - ${error}`);
    }
  }
}

export class KafkaConsumersHandlers {
  public async handleMessageFromKafka(
    topic: string,
    messageObj: Record<string, any>,
    connection: Connection,
  ): Promise<void> {
    try {
      console.log(`starting handleMessageFromKafka - topic: ${topic} - messageObj:`, messageObj);
      const messagePayload = new MessagePayload();
      messagePayload.messageType = MessageType.MESSAGE_ACKNOWLEDGEMENT;
      messagePayload.messageContent = topic;
      messagePayload.actorId = messageObj.payload.actorId;
      messagePayload.shipment = messageObj.payload.shipment;

      const token = messageObj.signature;

      let nonce = 0;
      let timestamp = 0;
      try {
        const dataFromNotary = await callNotaryService('post', messageObj.message.hash, token);
        nonce = dataFromNotary.nounce;
        timestamp = dataFromNotary.timestamp;
      } catch (error) {
        console.error('Error on retrieve data from notary => ', error);
      }
      const message = new Message();
      message.signature = token;
      message.nonce = nonce;
      message.timestamp = timestamp;
      message.payload = messagePayload;
      message.hash = messageObj.hash || '';

      const shipment = await connection.manager.findOne(Shipment, { id: messageObj.payload.shipment.id });
      if (isNil(shipment)) {
        throw new Error(`There is no shipment id ${messageObj.payload.shipment.id} on database`);
      }
      shipment.messagesReceived.push(message);
      await connection.manager.update(Shipment, { id: shipment?.id }, shipment);
    } catch (error) {
      console.error('Error on handleMessageFromKafka', error);
    }
  }
}
