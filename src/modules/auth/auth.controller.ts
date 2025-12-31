import { Body, Controller, Post, Req, Version, Get, Query, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { registerDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { User } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() dto: LoginDto, @Req() req: Request) {
        return await this.authService.login(dto, req);
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiBody({ schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } })
    @ApiResponse({ status: 200, description: 'Token refreshed' })
    @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
    @ApiResponse({ status: 400, description: 'User not found' })
    async refresh(@Body('refreshToken') refreshToken: string | undefined, @Req() req: Request) {
        return await this.authService.refresh(refreshToken, req);
    }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiBody({ type: registerDto })
    @ApiResponse({ status: 201, description: 'User registered and verification email sent' })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    @ApiResponse({ status: 403, description: 'You cannot assign yourself as admin' })
    async register(@Body() dto: registerDto, @Req() req: Request) {
        return await this.authService.register(dto, req);
    }

    @Post('resend-verification-email')
    @ApiOperation({ summary: 'Resend email verification' })
    @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string' } } } })
    @ApiResponse({ status: 200, description: 'Verification email resent if account exists' })
    @ApiResponse({ status: 400, description: 'Too many requests' })
    async resendVerification(@Body('email') email: string) {
        return await this.authService.resendVerification(email);
    }

    @Get('verify-email')
    @ApiOperation({ summary: 'Verify email via code' })
    @ApiQuery({ name: 'code', type: 'string' })
    @ApiQuery({ name: 'email', type: 'string' })
    @ApiResponse({ status: 401, description: 'Invalid verification code' })
    @ApiResponse({ status: 302, description: 'Redirects to frontend sign-in page' })
    async verify(@Query('code') code: string, @Query('email') email: string, @Res() res: Response) {
        const { redirectUrl } = await this.authService.verify(code, email);


        return res.redirect(redirectUrl);
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset' })
    @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string' } } } })
    @ApiResponse({ status: 200, description: 'Reset link sent if email exists' })
    @ApiResponse({ status: 400, description: 'Invalid request' })
    async forgotPassword(@Body('email') email: string) {
        return await this.authService.forgotPassword(email);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Reset user password' })
    @ApiBody({ type: ResetPasswordDto })
    @ApiResponse({ status: 200, description: 'Password changed successfully' })
    @ApiBadRequestResponse({ description: 'Invalid code, invalid email, or expired code' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return await this.authService.resetPassword(dto.email, dto.code, dto.password);
    }


    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Logout current session' })
    @ApiResponse({ status: 200, description: 'Logged out successfully' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized or invalid session' })
    @ApiBadRequestResponse({ description: 'Session revoke failed' })
    async logout(@User() user: any) {
        return await this.authService.logout(user.id, user.sessionId);
    }


    @Post('logout-all')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Logout all user sessions' })
    @ApiResponse({ status: 200, description: 'Logged out from all sessions' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBadRequestResponse({ description: 'Failed to revoke sessions' })
    async logoutAll(@User() user: any) {
        return await this.authService.logoutAll(user.id);
    }


    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOperation({ summary: 'Get current logged-in user' })
    @ApiResponse({ status: 200, description: 'Current user info returned' })
    @ApiNotFoundResponse({ description: 'User not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async getCurrentUser(@User() user: any) {
        return this.authService.getCurrentUser(user.id);
    }


    @UseGuards(JwtAuthGuard)
    @Post('account-deactivation')
    @ApiOperation({ summary: 'Deactivate user account' })
    @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
    @ApiNotFoundResponse({ description: 'User not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async deactivateAccount(@User() user: any) {
        return this.authService.deactivateAccount(user.id);
    }

}
