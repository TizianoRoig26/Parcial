export type UserRole = "pedidos" | "admin" | "client" | "stock" ;

export interface UserPublic {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  disabled: boolean;
}

export interface UserRegisterPayload {
  username: string;
  full_name: string;
  email: string;
  password: string;
}
