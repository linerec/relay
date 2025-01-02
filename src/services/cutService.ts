import { supabase } from '../lib/supabase';
import { Cut, CutUpdate } from '../types';

export async function updateCutOrder(cut: Cut, newOrderIndex: number) {
  const { error } = await supabase
    .from('cuts')
    .update({ order_index: newOrderIndex })
    .eq('id', cut.id);
  
  if (error) throw error;
}

export async function fetchCutsByComicId(comicId: string) {
  const { data, error } = await supabase
    .from('cuts')
    .select('*')
    .eq('comic_id', comicId)
    .order('order_index');

  if (error) throw error;
  return data || [];
}

export async function fetchCutById(cutId: string) {
  const { data, error } = await supabase
    .from('cuts')
    .select('*, comics(*)')
    .eq('id', cutId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateCut(cutId: string, updates: CutUpdate) {
  const { error } = await supabase
    .from('cuts')
    .update(updates)
    .eq('id', cutId);

  if (error) throw error;
}