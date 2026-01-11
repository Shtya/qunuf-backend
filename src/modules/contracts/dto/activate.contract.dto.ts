import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class ActivateContractDto {
    @ApiProperty({ example: 'CONT-2026-XYZ' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(50)
    contractNumber: string;
}