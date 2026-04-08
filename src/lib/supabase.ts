import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getImageUrl = (path: string) => {
  if (!path) return '/placeholder.webp';
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/sabores-img/${path}`;
};
