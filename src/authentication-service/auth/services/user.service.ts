import { Injectable } from '@nestjs/common';
import {User} from "../interfaces/user.interface";
import {
  UserAddOrUpdateOptionalData,
  UserChangePassword,
  UserChangeEmail
} from "../interfaces/userUpdate.interface";
import {UserLoginEmail, UserLoginUsername} from "../interfaces/userLogin.interface";
import {IAuthentication} from "../interfaces/IAuthentication";
import {JWTToken} from "../interfaces/JWTToken";

@Injectable()
export class AuthenticationService implements IAuthentication{
  private readonly user: User;
  
  register(user: User) {

  }
  
  login(user: UserLoginEmail | UserLoginUsername): Promise<JWTToken[]> {
  
    return Promise.resolve(undefined);
  }
  
  logout() {
  
  }
  
  changeEmail(user: UserChangeEmail) {
  
  }
  
  changePassword(user: UserChangePassword) {
  
  }
  
  addOrChangeOptionalData(user: UserAddOrUpdateOptionalData) {
  
  }
}
