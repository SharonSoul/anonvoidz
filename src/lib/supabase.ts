import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Void = {
  id: string;
  name: string;
  description?: string;
  access_code: string;
  user_cap: number;
  created_at: string;
  is_private: boolean;
  created_by: string;
};

export type VoidUser = {
  id: string;
  void_id: string;
  nickname: string;
  avatar_url: string;
  joined_at: string;
  media_uploads: {
    images: number;
    videos: number;
  };
};

export type Message = {
  id: string;
  void_id: string;
  user_id: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  created_at: string;
  expires_at: string;
}; 