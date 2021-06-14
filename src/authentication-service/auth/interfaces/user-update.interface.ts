export interface UserChangeEmail {
  oldEmail: string;
  newEmail: string;
  userId: string;
}

export interface UserChangePassword {
  oldPassword: string;
  newPassword: string;
  userId: string;
}

export interface UserAddOrUpdateOptionalData {
  firstName: string;
  lastName: string;
  birthday: string;
  phoneNumber: string;
  userId: string;
}
