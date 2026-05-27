export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  /** ISO timestamp */
  joinedAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}
