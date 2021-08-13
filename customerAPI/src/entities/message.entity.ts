import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';
import ShipmentDto from '../dto/shipment.dto';
import { MessageType } from '../utils/enums/message.enum';
export class MessagePayload extends BaseEntity {
  @Column({ type: 'enum', enum: MessageType })
  messageType: MessageType;

  @Column('int')
  actorId: number;

  @Column('text')
  messageContent: string;

  @Column('json')
  shipment: ShipmentDto;
}

@Entity({ name: 'message' })
export default class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuid();

  @Column('int')
  nonce: number;

  @Column('bigint')
  timestamp: number;

  @Column('json')
  payload: MessagePayload;

  @Column('text')
  hash: string;

  @Column('text')
  signature?: string;
}
