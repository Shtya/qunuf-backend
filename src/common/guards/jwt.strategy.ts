import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { SessionsService } from "src/modules/sessions/sessions.service";
import { Result } from "../utils/Result";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        configService: ConfigService,
        private sessionsService: SessionsService // Inject Service to check DB
    ) {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
            throw new BadRequestException(Result.badRequest('Invalid token structure'));
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: secret,
        });
    }

    async validate(payload: any) {
        // 1. Check if Session ID exists in payload
        if (!payload.sid) {
            throw new UnauthorizedException(Result.unauthorized('Invalid token structure'));
        }
        // 2. Check Database: Is this session active?
        const session = await this.sessionsService.getSession(payload.sid);
        if (!session) {
            // If we deleted the session from DB (logout), this fails immediately
            throw new UnauthorizedException(Result.unauthorized('Session not found or revoked'));
        }

        // 3. Return user object to Request
        return {
            id: payload.sub,
            role: payload.role,
            sessionId: payload.sid
        };
    }
}