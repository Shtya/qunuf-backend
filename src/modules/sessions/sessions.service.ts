import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { Session } from "src/common/entities/session.entity";
import { IsNull, Repository } from "typeorm";


@Injectable()
export class SessionsService {
    constructor(
        @InjectRepository(Session)
        private sessionRepository: Repository<Session>,

    ) { }


    async getIpAddress(req: Request): Promise<string> {
        const xff = (req.headers['x-forwarded-for'] as string) || '';
        const ip =
            (xff && xff.split(',')[0].trim()) ||
            (req?.socket && (req.socket as any).remoteAddress) ||
            (req as any).ip ||
            'unknown';

        return ip;
    }

    async createSession(userId: string, req: Request): Promise<Session> {
        const ipAddress = await this.getIpAddress(req);

        const session = this.sessionRepository.create({
            userId,
            ipAddress,
            revokedAt: null,       // active session
        });

        return await this.sessionRepository.save(session);
    }

    async updateRefreshTokenHash(sessionId: string, refreshTokenHash: string): Promise<Session> {
        const session = await this.sessionRepository.findOne({ where: { id: sessionId } });

        if (!session) {
            throw new NotFoundException(`Session not found`);
        }

        session.refreshTokenHash = refreshTokenHash;
        return await this.sessionRepository.save(session);
    }


    async getSession(sessionId: string) {
        const session = await this.sessionRepository.findOne({ where: { id: sessionId, revokedAt: IsNull() } });

        return session;
    }

    async revokeSession(sessionId: string): Promise<void> {
        const session = await this.sessionRepository.findOne({ where: { id: sessionId } });

        if (!session) {
            throw new NotFoundException(`Session not found`);
        }

        session.revokedAt = new Date();
        await this.sessionRepository.save(session);
    }

    async revokeAllUserSessions(userId: string): Promise<void> {
        await this.sessionRepository.update(
            { userId, revokedAt: IsNull() },
            { revokedAt: new Date() },
        );
    }
}