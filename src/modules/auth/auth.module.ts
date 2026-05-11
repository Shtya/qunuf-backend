import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersModule } from "../users/users.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Session } from "src/common/entities/session.entity";
import { EmailModule } from '../email/email.module';
import { JwtStrategy } from "src/common/guards/jwt.strategy";
import { SessionsModule } from "../sessions/sessions.module";
import { User } from "src/common/entities/user.entity";


@Module({
    imports: [
        TypeOrmModule.forFeature([Session, User]),
        UsersModule,
        SessionsModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule { }
