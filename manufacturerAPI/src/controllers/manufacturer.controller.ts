import { Request, Response } from 'express';
import { Producer } from 'kafkajs';
import { isNil } from 'ramda';
import Message from '../entities/message.entity';
import Event from '../entities/event.entity';
import { connection, kafka } from '../server';
import ManufacturerServices from '../services/manufacturer.services';
import { EventType } from '../utils/enums/event.enum';
import { MessageType } from '../utils/enums/message.enum';
import Shipment from '../entities/shipment.entity';

export default class ManufacturerController {
  private producer: Producer;
  private services: ManufacturerServices;

  constructor() {
    this.services = new ManufacturerServices();
  }

  createShipment = async (req: Request, res: Response) => {
    const shipment = await this.services.createShipment(req.body);
    const message = await this.services.createMessage(
      MessageType.EVENT_NOTIFICATION,
      'Shipment was successfully created!',
      shipment,
    );
    const shipmentCreatedEvent = await this.services.createEvent(EventType.SHIPMENT_CREATED, shipment);
    await this.getProducer().connect();
    console.log(shipmentCreatedEvent);
    await this.producer.send({
      topic: 'create.shipment.authority',
      messages: [{ key: shipmentCreatedEvent.id, value: this.constructMessageToSend(shipmentCreatedEvent, message) }],
    });
    await this.producer.send({
      topic: 'create.shipment.customer',
      messages: [{ key: shipmentCreatedEvent.id, value: this.constructMessageToSend(shipmentCreatedEvent, message) }],
    });
    return res.status(200).send({ shipment: shipment });
  };

  // Criar uma interface de retorno
  shipShipment = async (req: Request, res: Response) => {
    const shipment = await this.services.readShipment(req.body.id);
    // need to validate if is already shipped;
    if (isNil(shipment)) return res.status(404).send({ Error: 'Shipment not found' });
    const message = await this.services.createMessage(
      MessageType.EVENT_NOTIFICATION,
      'Shipment was successfully sent!',
      shipment,
    );
    const shipmentShippedEvent = await this.services.createEvent(EventType.SHIPMENT_SHIPPED, shipment);
    await this.getProducer().connect();
    await this.producer.send({
      topic: 'send.shipment.authority',
      messages: [{ key: shipmentShippedEvent.id, value: this.constructMessageToSend(shipmentShippedEvent, message) }],
    });
    await this.producer.send({
      topic: 'send.shipment.customer',
      messages: [{ key: shipmentShippedEvent.id, value: this.constructMessageToSend(shipmentShippedEvent, message) }],
    });
    return res.status(200).send({ shipment: shipment });
  };

  getAllShipments = async (req: Request, res: Response) => {
    const shipments = await connection.manager.find(Shipment);
    return res.status(200).send({ shipments: shipments });
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
