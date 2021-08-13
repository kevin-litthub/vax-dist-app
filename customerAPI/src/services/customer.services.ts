import { connection } from '..';
import Event, { EventPayload } from '../entities/event.entity';
import Message, { MessagePayload } from '../entities/message.entity';
import Shipment from '../entities/shipment.entity';
import { Actor } from '../utils/enums/actor.enum';
import { EventType } from '../utils/enums/event.enum';
import { MessageType } from '../utils/enums/message.enum';
import { callNotaryService, generateToken, isAuth } from '../utils/helperFunctions';
import { SHA256 } from 'crypto-js';
import ShipmentDto from '../dto/shipment.dto';

export default class CustomerServices {
  async validateMessage(topic: string, message: Message): Promise<boolean> {
    const shipmentDto = message.payload.shipment;
    const shipmentExists = await connection.manager.findOne(Shipment, { id: shipmentDto.id });
    if (!shipmentExists || (shipmentExists && shipmentExists.messagesSent.length === 0)) {
      return true;
    }

    if (isAuth(message.signature)) return true;

    const dataFromNotary = await callNotaryService('get', message.hash, message.signature || '')
    const { nonce, timestamp } = dataFromNotary;
    if (nonce === message.nonce && timestamp === message.timestamp) {
      return true;
    }

    return false;
  }

  async createShipment(shipment: Shipment): Promise<Shipment> {
    const { id, vaccineName, quantity, manufacturingDate, manufacturerId, authorityId, customerId } = shipment;
    return new Shipment(
      id,
      vaccineName,
      quantity,
      manufacturingDate,
      manufacturerId,
      authorityId,
      customerId,
    );
  }

  async createEvent(eventType: EventType, shipment: Shipment): Promise<Event> {
    const eventPayload = new EventPayload();
    eventPayload.eventType = eventType;
    eventPayload.actorId = Actor.Authority;

    const newEvent = new Event();
    const token = await generateToken(shipment);
    let nounce = 0;
    let timestamp = 0;

    try {
      const dataFromNotary = await callNotaryService('post', null, token);
      nounce = dataFromNotary.nounce;
      timestamp = dataFromNotary.timestamp;
    } catch (error) {
      console.error('Error on retrieve data from notary => ', error);
    }

    newEvent.signature = '';
    newEvent.nonce = nounce;
    newEvent.timestamp = timestamp;
    newEvent.payload = eventPayload;
    newEvent.hash = SHA256(JSON.stringify(eventPayload)).toString();

    shipment.events.push(newEvent);
    this.addShipmentDtoToAux(shipment, newEvent);

    return newEvent;
  }

  async createMessage(messageType: MessageType, messageContent: string, shipment: Shipment): Promise<Message> {
    const { id, vaccineName, quantity, manufacturingDate, manufacturerId, authorityId, customerId } = shipment;
    const newShipment = new ShipmentDto(
      id,
      vaccineName,
      quantity,
      manufacturingDate,
      manufacturerId,
      authorityId,
      customerId,
    );
    const messagePayload = new MessagePayload();
    messagePayload.shipment = newShipment;
    messagePayload.messageType = messageType;
    messagePayload.messageContent = messageContent;
    messagePayload.actorId = Actor.Customer;

    const newMessage = new Message();
    newMessage.payload = messagePayload;
    shipment.messagesSent.push(newMessage);

    await connection.manager.update(Shipment, { id: shipment.id }, shipment);
    return newMessage;
  }

  private async addShipmentDtoToAux(shipment: Shipment, aux: Message | Event) {
    await connection.manager.update(Shipment, { id: shipment.id }, shipment);

    const { id, vaccineName, quantity, manufacturingDate, manufacturerId, authorityId, customerId } = shipment;
    const shipmentDto = new ShipmentDto(
      id,
      vaccineName,
      quantity,
      manufacturingDate,
      manufacturerId,
      authorityId,
      customerId,
    );
    aux.payload.shipment = shipmentDto;
  }
}
