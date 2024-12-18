import { User } from "@ssmovzh/chatterly-common-utils";

export interface UserDataInterface {
  user: Omit<User, "password" | "salt">;
  accessToken: string;
  refreshToken: string;
}
