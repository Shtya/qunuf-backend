import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../common/entities/user.entity';
import { Address } from 'src/common/entities/address.entity';
import { State } from 'src/common/entities/state.entity';
import { Country } from 'src/common/entities/country.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Address,
      State,
      Country
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
