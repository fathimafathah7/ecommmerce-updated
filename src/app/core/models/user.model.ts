export type UserRole = 'user' | 'admin'
export interface User {
  id?: number | string;
  name: string;
  email: string;
  password: string;
  role?:UserRole;
  profilePhoto?:string;
}
