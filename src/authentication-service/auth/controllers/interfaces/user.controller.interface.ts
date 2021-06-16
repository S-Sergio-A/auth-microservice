import { UserAddOrUpdateOptionalData, UserChangeEmail, UserChangePassword } from '../../services/user/interfaces/user-update.interface';
import { UserLoginEmail, UserLoginUsername } from '../../pipes/interfaces/user-log-in.interface';
import { JWTToken } from '../../services/token/interfaces/jwt-token.interface';
import { Request } from 'express';
import { SignUpDto } from '../../dto/sign-up.dto';

export interface UserControllerInterface {
  register(req: Request, userSignUpDto: SignUpDto): void;

  login(user: UserLoginEmail | UserLoginUsername): Promise<JWTToken[]>;

  logout(): void;

  changeEmail(user: UserChangeEmail): void;

  changePassword(user: UserChangePassword): void;

  addOrChangeOptionalData(user: UserAddOrUpdateOptionalData): void;
}
