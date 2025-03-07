import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RolesService } from 'src/roles/roles.service';
import { RoleEnum } from 'src/auth/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly rolesService: RolesService
  ) { }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOne({
      where: {
        email: createUserDto.email
      }
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const defaultRole = await this.rolesService.findOneByRoleName(RoleEnum.USER);

    if(!defaultRole) {
      throw new BadRequestException('Default role not found');
    }

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword
    });

    user.roles = [defaultRole];

    const savedUser = this.usersRepository.save(user);

    const { password, ...result } = user;

    return result;

  }

  async assignRole(userId: string, roleName: string) {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId
      }
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const role = await this.rolesService.findOneByRoleName(roleName);

    if (!role) {
      throw new BadRequestException('Role not found');
    }

    user.roles.push(role);

    await this.usersRepository.save(user);

    return user;
  }

  async findAll() {
    return await this.usersRepository.find();
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne(
      {
        where: {
          id
        }
      }
    );
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async findOneByEmail(email: string) {
    const user = await this.usersRepository.findOne({
      where: {
        email
      }
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  updateUser(id: string, updateUserDto: UpdateUserDto) {
    // check if user exists
    const user = this.usersRepository.findOne({
      where: {
        id
      }
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const updatedUser = this.usersRepository.update(id, updateUserDto);
    return updatedUser;
  }

  remove(id: string) {
    // check if user exists
    const user = this.usersRepository.findOne({
      where: {
        id
      }
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const deletedUser = this.usersRepository.delete(id);
    return deletedUser;
  }
}
