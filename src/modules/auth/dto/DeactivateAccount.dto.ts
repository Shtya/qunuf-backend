import { IsOptional, IsString, MaxLength } from "class-validator";

export class DeactivateAccountDto {
    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
    reason?: string;
}