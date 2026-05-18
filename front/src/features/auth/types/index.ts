export interface IUser {
  id: number;
  user: string;
  password: string;  
}

export interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  token: string
  login: (credentials: { user: string; password: string }) => IUser | null;
  logout: VoidFunction;
  checkAuth: () => boolean;
}
