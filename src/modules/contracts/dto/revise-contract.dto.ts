import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class ReviseContractDto {
    @ApiProperty({ required: true })
    @IsString()
    @MaxLength(10000)
    newTerms: string;
}