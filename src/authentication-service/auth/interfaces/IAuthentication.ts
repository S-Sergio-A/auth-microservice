import {JWTToken} from "./JWTToken";
import {User} from "./user.interface";
import {UserLoginEmail, UserLoginUsername} from "./userLogin.interface";
import {UserAddOrUpdateOptionalData, UserChangeEmail, UserChangePassword} from "./userUpdate.interface";

export interface IAuthentication {
  register(user: User): void;
  
  login(user: UserLoginEmail | UserLoginUsername): Promise<JWTToken[]>;
  
  logout(): void;
  
  changeEmail(user: UserChangeEmail): void;
  
  changePassword(user: UserChangePassword): void;
  
  addOrChangeOptionalData(user: UserAddOrUpdateOptionalData): void;
}
