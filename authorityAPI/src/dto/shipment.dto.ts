import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { v4 as uuid } from 'uuid';

@Entity({ name: 'shipmentDto' })
export default class ShipmentDto {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuid();

  @Column('string')
  vaccineName: string;

  @Column('number')
  quantity: number;

  @Column('bigint')
  manufacturingDate: number;

  @Column('number')
  expirationDate: number;

  @Column('uuid')
  manufacturerId: string;

  @Column('uuid')
  authorityId: string;

  @Column('uuid')
  customerId: string;

  constructor(
    id: string,
    vaccineName: string,
    quantity: number,
    manufacturingDate: number,
    manufacturerId: string,
    authorityId: string,
    customerId: string,
  ) {
    this.id = id || uuid();
    this.vaccineName = vaccineName;
    this.quantity = quantity;
    this.manufacturingDate = manufacturingDate;
    this.expirationDate = this.expirationDate;
    this.manufacturerId = manufacturerId;
    this.authorityId = authorityId;
    this.customerId = customerId;
  }
}
