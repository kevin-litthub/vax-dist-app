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

  @PrimaryGeneratedColumn('increment')
  nonce: number;

  @Column('bigint')
  timestamp: number;

  @Column('json', { nullable: true })
  payload?: EventPayload;

  @Column('text', { nullable: true })
  hash?: string;

  @Column('text', { nullable: true })
  signature?: string;
}