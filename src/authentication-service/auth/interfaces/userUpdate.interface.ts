export interface UserChangeEmail {
  oldEmail: string;
  newEmail: string;
  id: string;
}

export interface UserChangePassword {
  oldPassword: string;
  newPassword: string;
  id: string;
}

export interface UserAddOrUpdateOptionalData {
  firstName: string;
  lastName: string;
  birthday: string;
  phoneNumber: string;
  id: string;
}
