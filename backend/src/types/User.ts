export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  // Add other user properties as needed
  createdAt: Date;
  updatedAt: Date;
}
