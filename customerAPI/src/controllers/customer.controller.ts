import { Request, Response } from 'express';
import { Producer } from 'kafkajs';
import { isNil } from 'ramda';
import { connection, kafka } from '..';
import Message from '../entities/message.entity';
import Event from '../entities/event.entity';
import CustomerServices from '../services/customer.services';
import Shipment from '../entities/shipment.entity';
import { EventType } from '../utils/enums/event.enum';
import { MessageType } from '../utils/enums/message.enum';
export default class CustomerController {
  private producer: Producer;
  private services: CustomerServices;

  constructor() {
    this.services = new CustomerServices();
  }

  acceptedShipment = async (req: Request, res: Response) => {
    const shipment = await connection.manager.findOne(Shipment, { id: req.body.id });
    if (isNil(shipment)) return res.status(404).send({ Error: 'There is no shipment stored with this id' });
    console.log('this.services => ', this.services);
    const shipmentAcceptedEvent = await this.services.createEvent(EventType.SHIPMENT_ACCEPTED, shipment);
    const shipmentAcceptedMessage = await this.services.createMessage(
      MessageType.EVENT_NOTIFICATION,
      'Shipment was accepted',
      shipment,
    );
    await this.getProducer().connect();
    await this.producer.send({
      topic: 'accept.shipment.manufacturer',
      messages: [
        {
          key: shipmentAcceptedEvent.id,
          value: this.constructMessageToSend(shipmentAcceptedEvent, shipmentAcceptedMessage),
        },
      ],
    });
    await this.producer.send({
      topic: 'accept.shipment.authority',
      messages: [
        {
          key: shipmentAcceptedEvent.id,
          value: this.constructMessageToSend(shipmentAcceptedEvent, shipmentAcceptedMessage),
        },
      ],
    });
    return res.status(200).send({ eventStatus: EventType.SHIPMENT_ACCEPTED, shipment: shipment });
  };

  rejectShipment = async (req: Request, res: Response) => {
    const shipment = await connection.manager.findOne(Shipment, { id: req.body.id });
    if (isNil(shipment)) return res.status(404).send({ Error: 'There is no shipment stored with this id' });
    const shipmentRejectEvent = await this.services.createEvent(EventType.SHIPMENT_REJECTED, shipment);
    const shipmentRejectMessage = await this.services.createMessage(
      MessageType.EVENT_NOTIFICATION,
      'Shipment was rejected',
      shipment,
    );
    await this.getProducer().connect();
    await this.producer.send({
      topic: 'reject.shipment.manufacturer',
      messages: [
        {
          key: shipmentRejectEvent.id,
          value: this.constructMessageToSend(shipmentRejectEvent, shipmentRejectMessage),
        },
      ],
    });
    await this.producer.send({
      topic: 'reject.shipment.authority',
      messages: [
        {
          key: shipmentRejectEvent.id,
          value: this.constructMessageToSend(shipmentRejectEvent, shipmentRejectMessage),
        },
      ],
    });
    return res.status(200).send({ eventStatus: EventType.SHIPMENT_REJECTED, shipment: shipment });
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
