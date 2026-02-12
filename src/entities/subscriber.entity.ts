import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SubscriberStatus {
  ACTIVE = 'active',
  UNSUBSCRIBED = 'unsubscribed',
  BOUNCED = 'bounced',
}

@Entity('subscribers')
export class Subscriber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({
    type: 'enum',
    enum: SubscriberStatus,
    default: SubscriberStatus.ACTIVE,
  })
  status: SubscriberStatus;

  @Column({ nullable: true })
  source: string;

  @Column({ default: 0 })
  emailsSent: number;

  @Column({ default: 0 })
  emailsOpened: number;

  @Column({ nullable: true })
  lastEmailAt: Date;

  @CreateDateColumn()
  subscribedAt: Date;

  @Column({ nullable: true })
  unsubscribedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

