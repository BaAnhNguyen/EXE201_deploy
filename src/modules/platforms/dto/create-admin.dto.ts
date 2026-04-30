import { IsEmail, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class CreateAdminDto {

    @IsEmail()
    email?: string;

    @IsString()
    @MinLength(8)
    password?: string;

    @IsString()
    fullName?: string;

    @IsPhoneNumber('VN')
    phone?: string;

    @IsOptional()
    @IsString()
    avatar?: string;

}