import { Controller, Post, Body, Put, Param } from '@nestjs/common';
import {UserAddOrUpdateOptionalDataDto} from "../dto/userAddOrUpdateOptionalData.dto";
import {UserChangePasswordDto} from "../dto/userUpdatePassword.dto";
import {UserChangeEmailDto} from "../dto/userUpdateEmail.dto";
import {UserSignUpDto} from "../dto/userSignUp.dto";

@Controller('user')
export class AuthenticationController {
  @Post('/sign-up')
  register(@Body() user: UserSignUpDto) {
  
  }
  
  @Post('/login')
  login(@Body() user: UserSignUpDto) {
  
  }
  
  @Put('/email/:id')
  changeEmail(@Param('id') id: string, @Body() updatedEmail: UserChangeEmailDto) {

  }
  
  @Put('/password/:id')
  changePassword(@Param('id') id: string, @Body() updatedPassword: UserChangePasswordDto) {

  }
  
  @Post('/optional/:id')
  addOrChangeOptionalData(@Param('id') id: string, @Body() optionalData: UserAddOrUpdateOptionalDataDto) {
  
  }
}
