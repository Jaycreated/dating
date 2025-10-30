export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  age?: number;
  gender?: string;
  bio?: string;
  location?: string;
  photos?: string | string[]; // Can be a JSON string or an array
  interests?: string; // JSON string array
  preferences?: string | UserPreferences; // Can be a JSON string or object
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  minAge?: number;
  maxAge?: number;
  gender?: string;
  sexual_orientation?: 'straight' | 'gay' | 'lesbian' | 'transgender';
  looking_for?: 'straight' | 'gay' | 'lesbian' | 'transgender';
  maxDistance?: number;
}

export interface Match {
  id: number;
  user_id: number;
  target_user_id: number;
  action: 'like' | 'pass';
  created_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  read_at?: string;
  created_at: string;
}

export interface AuthRequest extends Request {
  userId?: number;
}
