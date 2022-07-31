export interface IUser {
  id: number;
  email: string;
  name: string;
  nickname: string;
  password?: string;
  isActive: boolean;
}

