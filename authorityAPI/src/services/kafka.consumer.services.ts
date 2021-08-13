import { Producer } from 'kafkajs';
import { isNil } from 'ramda';
import { Connection } from 'typeorm';
import { KafkaConfigurations } from '../config/kafka.config';
import Message, { MessagePayload } from '../entities/message.entity';
import Event from '../entities/event.entity';
import { EventType } from '../utils/enums/event.enum';
import { MessageType } from '../utils/enums/message.enum';
import { callNotaryService } from '../utils/helperFunctions';
import AuthorityServices from './authority.services';

export class KafkaConsumers {
  public static async init(kafka: KafkaConfigurations, connection: Connection): Promise<void> {
    try {
      const kafkaConsumersHandlers = new KafkaConsumersHandlers();
      const consumer = kafka.kafka.consumer({ groupId: 'authority-group' });
      await consumer.connect();
      await consumer.subscribe({ topic: 'create.shipment.authority' });
      await consumer.subscribe({ topic: 'send.shipment.authority' });
      await consumer.subscribe({ topic: 'approved.shipment.manufacturer.ack' });
      await consumer.subscribe({ topic: 'approved.shipment.customer.ack' });
      await consumer.subscribe({ topic: 'block.shipment.manufacturer.ack' });
      await consumer.subscribe({ topic: 'block.shipment.customer.ack' });
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
  private authorityServices: AuthorityServices;

  constructor() {
    this.authorityServices = new AuthorityServices();
  }

  public async validateMessageFromKafka(
    topic: string,
    messageObj: Record<string, any>,
    connection: Connection,
    kafka: KafkaConfigurations,
  ): Promise<void> {
    console.log(`starting validateMessageFromKafka - topic: ${topic} - messageObj:`, messageObj);
    const producer = this.getProducer(kafka);
    await producer.connect();
    if (!this.authorityServices.validateMessage(topic, messageObj.message)) {
      const createShipmentAckEvent = await this.authorityServices.createEvent(
        EventType.SHIPMENT_BLOCKED,
        messageObj.message.payload.shipment,
      );
      await producer.send({
        topic: `${topic}.ack`,
        messages: [
          {
            key: messageObj.message.payload.shipment.id,
            value: this.constructMessageToSend(createShipmentAckEvent, messageObj.message),
          },
        ],
      });
      console.log('create.shipment.authority.ack produced');
    }
    this.handleMessageFromKafka(topic, messageObj, connection, kafka);
  }

  public async handleMessageFromKafka(
    topic: string,
    messageObj: Record<string, any>,
    connection: Connection,
    kafka: KafkaConfigurations,
  ): Promise<void> {
    try {
      console.log(`starting handleMessageFromKafka - topic: ${topic} - messageObj:`, messageObj);
      const producer = this.getProducer(kafka);
      await producer.connect();

      const shipment = await this.authorityServices.createShipment(messageObj.message.payload.shipment);
      shipment.events.push(messageObj.message.payload.shipment.events || messageObj.event);
      shipment.messagesReceived.push(messageObj.message.payload.shipment.messagesSent || messageObj.message);
      await connection.manager.save(shipment);

      const messagePayload = new MessagePayload();
      messagePayload.messageType = MessageType.MESSAGE_ACKNOWLEDGEMENT;
      messagePayload.messageContent = topic;
      messagePayload.actorId = messageObj.message.payload.actorId;
      messagePayload.shipment = messageObj.message.payload.shipment;

      const token = messageObj.message.signature;

      let nonce = 0;
      let timestamp = 0;
      try {
        const dataFromNotary = await callNotaryService('get', messageObj.event.id, token);
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
      message.hash = messageObj.hash;

      if (topic === 'create.shipment.authority') {
        await producer.send({
          topic: 'create.shipment.authority.ack',
          messages: [{ key: messagePayload.shipment.id, value: JSON.stringify(message) }],
        });
        shipment.messagesSent.push(message);
        console.log('create.shipment.authority.ack produced');
      }

      if (topic === 'send.shipment.authority') {
        await producer.send({
          topic: 'send.shipment.authority.ack',
          messages: [{ key: messagePayload.shipment.id, value: JSON.stringify(message) }],
        });
        shipment.messagesSent.push(message);
        console.log('send.shipment.authority.ack produced');
      }

      await connection.manager.save(shipment);
    } catch (error) {
      console.error('Error on handleMessageFromKafka', error);
    }
  }

  private getProducer(kafka: KafkaConfigurations) {
    if (isNil(this.producer)) {
      this.producer = kafka.kafka.producer();
    }
    return this.producer;
  }

  private constructMessageToSend(shipmentEvent: Event, shipmentMessage: Message) {
    const shipmentObjectToSend = { event: shipmentEvent, message: shipmentMessage };
    return JSON.stringify(shipmentObjectToSend);
  }
}
