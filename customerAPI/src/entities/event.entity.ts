import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';
import { v4 as uuid } from 'uuid';
import ShipmentDto from '../dto/shipment.dto';
import { EventType } from '../utils/enums/event.enum';
export class EventPayload extends BaseEntity {
  @Column({ type: 'enum', enum: EventType })
  eventType: EventType;

  @Column('int')
  actorId: number;

  @Column('json')
  shipment: ShipmentDto;
}

@Entity({ name: 'event' })
export default class Event extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuid();

  @Column('int')
  nonce: number;

  @Column('bigint')
  timestamp: number;

  @Column('json')
  payload: EventPayload;

  @Column('text')
  hash: string;

  @Column('text')
  signature?: string;
}
