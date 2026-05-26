export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  /** ISO timestamp */
  joinedAt: string;
}

/**
 * Extended profile stored in Firestore at users/{uid}. Holds user-editable
 * fields beyond what Firebase Auth tracks natively (bio, preferences).
 * `email` and `id` come from Firebase Auth and are not stored here.
 */
export interface UserProfileDoc {
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  /** ISO timestamp of document creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
}

export interface UserProfileUpdate {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}
