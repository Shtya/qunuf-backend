
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateBlogDto } from './create-blog.dto';
import { PartialType } from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';

export class UpdateBlogDto extends PartialType(CreateBlogDto) {
    @ApiPropertyOptional({ type: 'string', format: 'binary' })
    @IsOptional()
    image?: any;
}