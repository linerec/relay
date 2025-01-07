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
    .select(`
      *,
      profiles!created_by(username)
      `)
    .eq('comic_id', comicId)
    .order('order_index');

  if (error) throw error;
  return data || [];
}

export async function fetchCutById(cutId: string) {
  const { data, error } = await supabase
    .from('cuts')
    .select(`
      *,
      comics(*),
      profiles(username)
    `)
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

export async function saveCutWithLayers(cutId: string, {
  drawing,
  background_color,
  layer01,
  layer02,
  layer03,
  layer04,
  layer05,
  ...rest
}: CutUpdate) {
  const updates = {
    ...rest,
    drawing, // 모든 레이어를 합친 미리보기 이미지
    background_color,
    layer01,
    layer02,
    layer03,
    layer04,
    layer05,
  };

  const { error } = await supabase
    .from('cuts')
    .update(updates)
    .eq('id', cutId);

  if (error) throw error;
}