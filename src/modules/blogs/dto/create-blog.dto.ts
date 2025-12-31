import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBlogDto {
    @ApiProperty({ maxLength: 255, example: 'My First Blog' })
    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: 'The content of the blog' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ type: 'string', format: 'binary', required: false })
    @IsOptional()
    image?: any;
}