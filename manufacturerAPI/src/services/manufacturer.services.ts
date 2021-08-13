/* eslint-disable prefer-const */
import ShipmentDto from '../dto/shipment.dto';
import Event, { EventPayload } from '../entities/event.entity';
import Message, { MessagePayload } from '../entities/message.entity';
import Shipment from '../entities/shipment.entity';
import { connection } from '../server';
import { Actor } from '../utils/enums/actor.enum';
import { EventType } from '../utils/enums/event.enum';
import { MessageType } from '../utils/enums/message.enum';
import { callNotaryService, generateToken } from '../utils/helperFunctions';
import { SHA256 } from 'crypto-js';
export default class ManufacturerServices {
  async createShipment(shipmentDto: ShipmentDto): Promise<Shipment> {
    const { id, vaccineName, quantity, manufacturingDate, manufacturerId, authorityId, customerId } = shipmentDto;
    const newShipment = new Shipment(
      id,
      vaccineName,
      quantity,
      manufacturingDate,
      manufacturerId,
      authorityId,
      customerId,
    );
    await connection.manager.save(newShipment);
    return newShipment;
  }

  async readShipment(idInput: string): Promise<Shipment | undefined> {
    const shipment = await connection.manager.findOne(Shipment, { id: idInput });
    return shipment;
  }

  async createEvent(eventType: EventType, shipment: Shipment): Promise<Event> {
    const eventPayload = new EventPayload();
    eventPayload.eventType = eventType;
    eventPayload.actorId = Actor.Manufacturer;

    const newEvent = new Event();
    const hash = SHA256(JSON.stringify(eventPayload)).toString();
    const token = await generateToken(shipment);
    let nounce = 0;
    let timestamp = 0;
    let id = '';
    try {
      const dataFromNotary = await callNotaryService('post', hash, token);
      id = dataFromNotary?.id;
      nounce = dataFromNotary?.nounce;
      timestamp = dataFromNotary?.timestamp;
    } catch (error) {
      console.error('Error on retrieve data from notary => ', error);
    }
    newEvent.id = id;
    newEvent.signature = token;
    newEvent.nonce = nounce;
    newEvent.timestamp = timestamp;
    newEvent.payload = eventPayload;
    newEvent.hash = hash;

    shipment.events.push(newEvent);
    this.addShipmentDtoToAux(shipment, newEvent);

    return newEvent;
  }

  async createMessage(messageType: MessageType, messageContent: string, shipment: Shipment): Promise<Message> {
    const messagePayload = new MessagePayload();
    messagePayload.messageType = messageType;
    messagePayload.messageContent = messageContent;
    messagePayload.actorId = Actor.Manufacturer;
    const message = new Message();
    const hash = SHA256(JSON.stringify(messagePayload)).toString();
    const token = await generateToken(shipment);
    let nounce = 0;
    let timestamp = 0;
    try {
      const dataFromNotary = await callNotaryService('post', hash, token);
      nounce = dataFromNotary?.nounce;
      timestamp = dataFromNotary?.timestamp;
    } catch (error) {
      console.error('Error on retrieve data from notary => ', error);
    }

    message.signature = token;
    message.nonce = nounce;
    message.timestamp = timestamp;
    message.payload = messagePayload;
    message.hash = token;

    shipment.messagesSent.push(message);
    this.addShipmentDtoToAux(shipment, message);

    return message;
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
