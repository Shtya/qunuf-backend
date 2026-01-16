import { Column, Entity } from "typeorm";
import { CoreEntity } from "./coreEntity";

@Entity('news_letters')
export class Newsletter extends CoreEntity {

    @Column({ unique: true })
    email: string;

    @Column({ default: true })
    isActive: boolean;

}