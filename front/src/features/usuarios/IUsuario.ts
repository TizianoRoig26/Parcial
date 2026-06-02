import type { UserRole } from "../auth";


export interface UserPublic {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  disabled: boolean;
}
