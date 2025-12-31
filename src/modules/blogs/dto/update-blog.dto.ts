import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateBlogDto } from './create-blog.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateBlogDto extends PartialType(CreateBlogDto) { }
