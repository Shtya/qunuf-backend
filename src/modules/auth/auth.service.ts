import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { LoginDto } from "./dto/login.dto";
import { User, UserRole, UserStatus } from "src/common/entities/user.entity";
import { SessionsService } from "../sessions/sessions.service";
import { Request } from "express";
import type { StringValue } from "ms";
import * as bcrypt from 'bcrypt';
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { EmailService } from '../email/email.service';
import { v4 as uuidv4 } from 'uuid';
import { Session } from "src/common/entities/session.entity";


export interface JwtPayload {
    sub: string;
    sid: string;
    role: string;
}


@Injectable()
export class AuthService {
    constructor(

        private usersService: UsersService,
        private sessionsService: SessionsService,
        private jwtService: JwtService,
        private configService: ConfigService,

        @InjectRepository(User)
        private userRepository: Repository<User>,
        private emailService: EmailService,
    ) { }

    CODE_EXPIRE = 24;
    RESEND_TIME = 30;
    RESET_EXPIRE_HOURS = 1; // reset token valid for 1 hour

    async login(loginDto: LoginDto, req: Request) {
        // 1) Validate user credentials
        const user = await this.usersService.validateUser(loginDto.email, loginDto.password);

        // 2) Check user status
        switch (user.status) {
            case UserStatus.INACTIVE:
            case UserStatus.DELETED:
                throw new UnauthorizedException('Your account is inactive. Please contact support.');
            case UserStatus.SUSPENDED:
                throw new UnauthorizedException('Your account has been suspended. Please contact support.');
            case UserStatus.PENDING_VERIFICATION:
                throw new UnauthorizedException('Please verify your email before logging in.');
        }

        // 3) Update last login
        user.lastLogin = new Date();

        // 4) Create a new DB session
        const session = await this.sessionsService.createSession(user.id, req);


        // 5) Sign tokens
        const { accessToken, refreshToken } = this.signTokens(user, session.id);

        await this.userRepository.save(user);

        // 6) Store refresh token hash for rotation & revocation
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        await this.sessionsService.updateRefreshTokenHash(session.id, refreshTokenHash);

        return (
            {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    status: user.status,
                    lastLogin: user.lastLogin,
                },
            }
        );
    }

    async register(createUserDto: any, req: Request) {
        const { name, email, password, role } = createUserDto;

        // 1) Prevent duplicate emails
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) { throw new ConflictException('Email already exists'); }
        // 2) Prevent self-assigning admin role
        if (role === UserRole.ADMIN) { throw new ForbiddenException('You cannot assign yourself as admin'); }
        // 3) Create user
        const user = await this.usersService.create({ name, email, password, role });

        // 4) Generate email verification code
        const code = uuidv4();
        const now = new Date();
        const expires = new Date(now.getTime() + this.CODE_EXPIRE * 60 * 60 * 1000); // 24 hours

        user.emailVerificationCode = code;
        user.emailVerificationSentAt = now;
        user.emailVerificationExpires = expires;
        user.status = UserStatus.PENDING_VERIFICATION;

        await this.userRepository.save(user);

        // 5) Build verification link
        const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:8081');
        const link = `${appUrl}/api/v1/auth/verify-email?code=${code}&email=${user.email}`;

        await this.emailService.sendVerificationEmail(user.email, link);

        return { email: user.email };
    }


    async resendVerification(email: string) {
        const user = await this.userRepository.findOne({
            where: { email },
            select: [
                'id',
                'email',
                'status',
                'emailVerificationCode',
                'emailVerificationExpires',
                'emailVerificationSentAt',
            ],
        });

        // Always return generic message to prevent enumeration
        if (!user) {
            return { message: 'If the email is registered, a verification email has been resent.' };
        }

        if (user.status === UserStatus.ACTIVE) {
            return { message: 'This account is already verified.' };
        }


        const now = new Date();

        // Prevent resend within RESEND_TIME seconds
        if (
            user.emailVerificationSentAt &&
            now.getTime() - user.emailVerificationSentAt.getTime() < this.RESEND_TIME * 1000
        ) {
            const elapsed = (now.getTime() - user.emailVerificationSentAt.getTime()) / 1000;
            const remaining = Math.ceil(this.RESEND_TIME - elapsed);
            throw new BadRequestException(`Please wait ${remaining} seconds before requesting another verification email`);
        }

        const code = uuidv4();
        const expires = new Date(now.getTime() + this.CODE_EXPIRE * 60 * 60 * 1000);

        user.emailVerificationCode = code;
        user.emailVerificationSentAt = now;
        user.emailVerificationExpires = expires;

        await this.userRepository.save(user);

        const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:8081');
        const link = `${appUrl}/api/v1/auth/verify-email?code=${code}&email=${user.email}`;

        await this.emailService.sendVerificationEmail(user.email, link);

        return { message: 'If the email is registered, verification email resent' };

    }

    async forgotPassword(email: string) {
        if (!email) {
            throw new BadRequestException('Email is required');
        }

        const user = await this.userRepository.findOne({
            where: { email },
            select: [
                'id',
                'email',
                'status',
                'resetPasswordToken',
                'lastResetPasswordSentAt',
                'resetPasswordExpires',
            ],
        });

        // Always return generic message to prevent user enumeration
        if (!user) {
            return { message: 'If the email is registered, a reset link has been sent' };
        }

        if (user.status !== UserStatus.ACTIVE) {
            throw new BadRequestException('Only active users can reset password');
        }

        const now = new Date();

        // Prevent resend within RESEND_TIME seconds
        if (
            user.lastResetPasswordSentAt &&
            now.getTime() - user.lastResetPasswordSentAt.getTime() < this.RESEND_TIME * 1000
        ) {
            const elapsed = (now.getTime() - user.lastResetPasswordSentAt.getTime()) / 1000;
            const remaining = Math.ceil(this.RESEND_TIME - elapsed);

            throw new BadRequestException(`Please wait ${remaining} seconds before requesting another reset email`);
        }

        const code = uuidv4();
        const expires = new Date(now.getTime() + this.RESET_EXPIRE_HOURS * 60 * 60 * 1000);

        user.resetPasswordToken = code;
        user.lastResetPasswordSentAt = now;
        user.resetPasswordExpires = expires;

        await this.userRepository.save(user);

        const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
        const resetLink = `${frontendUrl}/auth/reset-password?code=${code}&email=${encodeURIComponent(user.email)}`;

        await this.emailService.sendResetPasswordEmail(user.email, resetLink);

        return { message: 'If the email is registered, a reset link has been sent' };
    }


    async resetPassword(email: string, code: string, newPassword: string) {
        const user = await this.userRepository.findOne({
            where: { email },
            select: [
                'id',
                'email',
                'status',
                'resetPasswordToken',
                'resetPasswordExpires',
            ],
        });

        if (!user || user.resetPasswordToken !== code) {
            throw new BadRequestException('Invalid reset code or email');
        }

        if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
            throw new BadRequestException('Reset code expired');
        }

        // Update password
        const hashed = await bcrypt.hash(newPassword, 10);
        (user as any).passwordHash = hashed;

        // Clear reset fields
        user.resetPasswordToken = null;
        user.lastResetPasswordSentAt = null;
        user.resetPasswordExpires = null;

        await this.userRepository.save(user);

        // Notify user
        await this.emailService.sendPasswordChangedEmail(user.email);

        return { message: 'Password changed successfully' };
    }

    async verify(code: string, email: string) {
        const user = await this.userRepository.findOne({
            where: { email },
            select: [
                'id',
                'email',
                'status',
                'emailVerificationCode',
                'emailVerificationExpires',
                'emailVerificationSentAt',
            ],
        });

        if (!user || user.emailVerificationCode !== code) {
            throw new UnauthorizedException('Invalid verification code');
        }

        if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
            throw new UnauthorizedException('Verification code expired');
        }

        // Mark user as verified
        user.status = UserStatus.ACTIVE;
        user.emailVerificationCode = null;
        user.emailVerificationSentAt = null;
        user.emailVerificationExpires = null;

        await this.userRepository.save(user);

        const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
        const redirectUrl = `${frontendUrl}/auth/sign-in`;

        return { redirectUrl };
    }


    private signTokens(user: Partial<User>, sessionId: string) {
        const accessToken = this.jwtService.sign(
            {
                sub: user.id,
                sid: sessionId,
                role: user.role,
            } as JwtPayload,
            {
                secret: this.configService.get<string>('JWT_SECRET', ''),
                expiresIn: this.configService.get<StringValue>('JWT_EXPIRE', '1h'),
            },
        );

        const refreshToken = this.jwtService.sign(
            {
                sub: user.id,
                sid: sessionId,
                role: user.role,
            } as JwtPayload,
            {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET', ''),
                expiresIn: this.configService.get<StringValue>('JWT_REFRESH_EXPIRE', '7d'),
            },
        );

        return { accessToken, refreshToken };
    }

    private generateOTP() {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        return otp
    }

    async refresh(providedRefreshToken: string | undefined, req: Request) {
        const token = providedRefreshToken || (req.cookies && (req.cookies as any).refresh_token);
        if (!token) {
            throw new UnauthorizedException('Refresh token not provided');
        }

        let payload: any;
        try {
            payload = this.jwtService.verify(token, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET', ''),
            });
        } catch (e) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // 1) Get session
        const session = await this.sessionsService.getSession(payload.sid);

        if (!session) {
            throw new UnauthorizedException('Session not found or revoked');
        }

        // 2) Validate refresh token hash
        const isValid = await bcrypt.compare(token, session.refreshTokenHash || '');
        if (!isValid) {
            throw new UnauthorizedException('Refresh token revoked');
        }

        // 3) Get user
        const user = await this.userRepository.findOne({ where: { id: payload.sub } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // 4) Rotate tokens
        const { accessToken, refreshToken } = this.signTokens(user, session.id);
        const newHash = await bcrypt.hash(refreshToken, 10);
        await this.sessionsService.updateRefreshTokenHash(session.id, newHash);

        return { accessToken, refreshToken, user }
    }




    async logout(userId: string, sessionId: string) {
        await this.sessionsService.revokeSession(sessionId);


        return { message: 'Logged out successfully' };
    }

    async logoutAll(userId: string) {
        await this.sessionsService.revokeAllUserSessions(userId);


        return { message: 'Logged out from all sessions' };
    }

    // Get current user by ID
    async getCurrentUser(userId: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        return user;
    }

    // Deactivate account (set status to INACTIVE)
    async deactivateAccount(userId: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        user.status = UserStatus.INACTIVE;
        await this.userRepository.save(user);

        return { message: 'Account deactivated successfully' };
    }
}