import { Body, Controller, Post, Req, Version, Get, Query, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { registerDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { User } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {

    constructor(
        private authService: AuthService,
    ) { }

    @Post('login')
    async login(@Body() dto: LoginDto, @Req() req: Request) {
        return await this.authService.login(dto, req);
    }

    @Post('refresh')
    async refresh(@Body('refreshToken') refreshToken: string | undefined, @Req() req: Request) {
        return await this.authService.refresh(refreshToken, req);
    }

    @Post('register')
    async register(@Body() dto: registerDto, @Req() req: Request) {
        return await this.authService.register(dto, req);
    }

    @Post('resend-verification-email')
    async resendVerification(@Body('email') email: string) {
        return await this.authService.resendVerification(email);
    }

    @Get('verify-email')
    async verify(@Query('code') code: string, @Query('email') email: string, @Res() res: Response) {
        const result = await this.authService.verify(code, email);
        return res.redirect(result.redirectUrl);
    }

    @Post('forgot-password')
    async forgotPassword(@Body('email') email: string) {
        return await this.authService.forgotPassword(email);
    }

    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return await this.authService.resetPassword(dto.email, dto.code, dto.password);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    async logout(@User() user: any) {
        return await this.authService.logout(user.id, user.sessionId);
    }

    @Post('logout-all')
    @UseGuards(JwtAuthGuard)
    async logoutAll(@User() user: any) {
        return await this.authService.logoutAll(user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getCurrentUser(@User() user: any) {
        return this.authService.getCurrentUser(user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('account-deactivation')
    async deactivateAccount(@User() user: any) {
        return this.authService.deactivateAccount(user.id);
    }

}
