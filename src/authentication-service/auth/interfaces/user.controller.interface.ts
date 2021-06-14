import {JWTToken} from "./jwt-token.interface";
import {UserLoginEmail, UserLoginUsername} from "./user-login.interface";
import {UserAddOrUpdateOptionalData, UserChangeEmail, UserChangePassword} from "./user-update.interface";
import {Request} from "express";
import {SignUpDto} from "../dto/sign-up.dto";

export interface UserControllerInterface {
  register(req: Request, userSignUpDto: SignUpDto): void;
  
  login(user: UserLoginEmail | UserLoginUsername): Promise<JWTToken[]>;
  
  logout(): void;
  
  changeEmail(user: UserChangeEmail): void;
  
  changePassword(user: UserChangePassword): void;
  
  addOrChangeOptionalData(user: UserAddOrUpdateOptionalData): void;
}
