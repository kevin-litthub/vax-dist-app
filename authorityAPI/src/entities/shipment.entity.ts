import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';
import { v4 as uuid } from 'uuid';
import Message from './message.entity';
import Event from './event.entity';

@Entity({ name: 'shipment' })
export default class Shipment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuid();

  @Column('text')
  vaccineName: string;

  @Column('int')
  quantity: number;

  @Column('bigint')
  manufacturingDate: number;

  @Column('text')
  manufacturerId: string;

  @Column('text')
  authorityId: string;

  @Column('text')
  customerId: string;

  @Column({ type: 'jsonb', default: [], nullable: true })
  events: Event[];

  @Column({ type: 'jsonb', default: [], nullable: true })
  messagesSent: Message[];

  @Column({ type: 'jsonb', default: [], nullable: true })
  messagesReceived: Message[];

  constructor(
    id: string,
    vaccineName: string,
    quantity: number,
    manufacturingDate: number,
    manufacturerId: string,
    authorityId: string,
    customerId: string,
  ) {
    super();
    this.id = id || uuid();
    this.vaccineName = vaccineName;
    this.quantity = quantity;
    this.manufacturingDate = manufacturingDate;
    this.manufacturerId = manufacturerId;
    this.authorityId = authorityId;
    this.customerId = customerId;
    this.events = [];
    this.messagesSent = [];
    this.messagesReceived = [];
  }
}
