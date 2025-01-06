import { supabase } from '../lib/supabase';
import { Comic } from '../types';

export async function createComic(title: string, collaborators: string[] = []): Promise<Comic | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('comics')
    .insert([{
      title,
      owner_id: user.id,
      collaborators
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating comic:', error);
    return null;
  }

  return data;
}

export async function fetchComics(): Promise<Comic[]> {
  const { data, error } = await supabase
    .from('comics')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching comics:', error);
    return [];
  }

  return data || [];
}