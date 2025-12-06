import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { Session } from "src/common/entities/session.entity";
import { Result } from "src/common/utils/Result";
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

    async createSession(userId: string, req: Request) {
        const ipAddress = await this.getIpAddress(req);

        const session = this.sessionRepository.create({
            userId,
            ipAddress,
            revokedAt: null, // active session
        });

        const saved = await this.sessionRepository.save(session);
        return Result.created(saved, 'Session created successfully');
    }

    async updateRefreshTokenHash(sessionId: string, refreshTokenHash: string) {
        const session = await this.sessionRepository.findOne({ where: { id: sessionId } });

        if (!session) return Result.notFound('Session not found');

        session.refreshTokenHash = refreshTokenHash;
        const updated = await this.sessionRepository.save(session);
        return Result.ok(updated, 'Refresh token updated successfully');
    }

    async getSession(sessionId: string) {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId, revokedAt: IsNull() },
        });

        if (!session) return Result.notFound('Session not found');
        return Result.ok<Session>(session, 'Session fetched successfully');
    }

    async revokeSession(sessionId: string) {
        const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
        if (!session) return Result.notFound('Session not found');

        session.revokedAt = new Date();
        await this.sessionRepository.save(session);
        return Result.ok(null, 'Session revoked successfully');
    }

    async revokeAllUserSessions(userId: string) {
        await this.sessionRepository.update(
            { userId, revokedAt: IsNull() },
            { revokedAt: new Date() },
        );
        return Result.ok(null, 'All user sessions revoked successfully');
    }
}
