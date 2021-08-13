import { Request, Response } from 'express';
import { Producer } from 'kafkajs';
import { isNil } from 'ramda';
import { connection, kafka } from '..';
import Message from '../entities/message.entity';
import Event from '../entities/event.entity';
import AuthorityServices from '../services/authority.services';
import Shipment from '../entities/shipment.entity';
import { EventType } from '../utils/enums/event.enum';
import { MessageType } from '../utils/enums/message.enum';
export default class AuthorityController {
  private producer: Producer;
  private services: AuthorityServices;

  constructor() {
    this.services = new AuthorityServices();
  }

  approvedShipment = async (req: Request, res: Response) => {
    const shipment = await connection.manager.findOne(Shipment, { id: req.body.id });
    if (isNil(shipment)) return res.status(404).send({ Error: 'There is no shipment stored with this id' });
    console.log('this.services => ', this.services);
    const shipmentApprovedEvent = await this.services.createEvent(EventType.SHIPMENT_APPROVED, shipment);
    const shipmentApprovedMessage = await this.services.createMessage(
      MessageType.EVENT_NOTIFICATION,
      'Shipment was approved',
      shipment,
    );
    await this.getProducer().connect();
    await this.producer.send({
      topic: 'approved.shipment.manufacturer',
      messages: [
        {
          key: shipmentApprovedEvent.id,
          value: this.constructMessageToSend(shipmentApprovedEvent, shipmentApprovedMessage),
        },
      ],
    });
    await this.producer.send({
      topic: 'approved.shipment.consumer',
      messages: [
        {
          key: shipmentApprovedEvent.id,
          value: this.constructMessageToSend(shipmentApprovedEvent, shipmentApprovedMessage),
        },
      ],
    });
    return res.status(200).send({ eventStatus: EventType.SHIPMENT_APPROVED, shipment: shipment });
  };

  blockShipment = async (req: Request, res: Response) => {
    const shipment = await connection.manager.findOne(Shipment, { id: req.body.id });
    if (isNil(shipment)) return res.status(404).send({ Error: 'There is no shipment stored with this id' });
    const shipmentBlockedEvent = await this.services.createEvent(EventType.SHIPMENT_BLOCKED, shipment);
    const shipmentBlockedMessage = await this.services.createMessage(
      MessageType.EVENT_NOTIFICATION,
      'Shipment was blocked',
      shipment,
    );
    await this.getProducer().connect();
    await this.producer.send({
      topic: 'block.shipment.manufacturer',
      messages: [
        {
          key: shipmentBlockedEvent.id,
          value: this.constructMessageToSend(shipmentBlockedEvent, shipmentBlockedMessage),
        },
      ],
    });
    await this.producer.send({
      topic: 'block.shipment.consumer',
      messages: [
        {
          key: shipmentBlockedEvent.id,
          value: this.constructMessageToSend(shipmentBlockedEvent, shipmentBlockedMessage),
        },
      ],
    });
    return res.status(200).send({ eventStatus: EventType.SHIPMENT_BLOCKED, shipment: shipment });
  };

  private getProducer() {
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
