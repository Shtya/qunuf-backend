import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveGoogleCredentialDto {
    @ApiProperty({ description: 'Google OAuth 2.0 Client ID' })
    @IsString()
    @MinLength(10)
    @MaxLength(500)
    clientId: string;

    @ApiProperty({ description: 'Google OAuth 2.0 Client Secret' })
    @IsString()
    @MinLength(10)
    @MaxLength(500)
    clientSecret: string;
}
