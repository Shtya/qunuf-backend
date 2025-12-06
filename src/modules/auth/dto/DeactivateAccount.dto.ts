import { IsOptional, IsString, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class DeactivateAccountDto {
    @ApiPropertyOptional({
        description: 'Reason for deactivating the account',
        maxLength: 500,
        example: 'No longer using the platform',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
    reason?: string;
}
