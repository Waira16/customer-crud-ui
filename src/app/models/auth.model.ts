export interface AuthUser {
  token: string;
  username: string;
  roles: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  roles: string[];
}

export const AUTH_TOKEN_KEY = 'crm_auth_token';
export const AUTH_USER_KEY = 'crm_auth_user';
