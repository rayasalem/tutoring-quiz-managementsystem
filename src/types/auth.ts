export type Role = 'STUDENT' | 'TEACHER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  className?: string | null;
  createdAt?: string | null;
}

export interface AuthResponse {
  user: User;
  token: string;
}
