import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { ConversationsController } from "./conversations.controller";
import { ConversationsService } from "./conversations.service";
import { Conversation } from "src/common/entities/conversation.entity";
import { User } from "src/common/entities/user.entity";
import { AppGateway } from "src/common/websocket/app.gateway";
import { Message } from "src/common/entities/message.entity";


@Module({
    imports: [TypeOrmModule.forFeature([Message, Conversation, User])],
    controllers: [ConversationsController],
    providers: [
        ConversationsService,
        AppGateway // Ensure gateway is provided if MessagesService uses it
    ],
    exports: [ConversationsService]
})
export class ConversationsModule { }