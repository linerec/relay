import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export async function searchUsers(searchTerm: string): Promise<Profile[]> {
  if (searchTerm.length < 2) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .ilike('username', `%${searchTerm}%`)
    .limit(5);

  if (error) {
    console.error('Error searching users:', error);
    return [];
  }

  return data || [];
}