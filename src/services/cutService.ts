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

export async function fetchCutById(cutId: string): Promise<Cut> {
  const { data, error } = await supabase
    .from('cuts')
    .select('*, comics(*), profiles(username)')
    .eq('id', cutId)
    .single();

  if (error) throw error;

  // 레이어 데이터 파싱 (한 번만 파싱)
  const parsedData = {
    ...data,
    layer01: data.layer01 ? JSON.parse(data.layer01) : null,
    layer02: data.layer02 ? JSON.parse(data.layer02) : null,
    layer03: data.layer03 ? JSON.parse(data.layer03) : null,
    layer04: data.layer04 ? JSON.parse(data.layer04) : null,
    layer05: data.layer05 ? JSON.parse(data.layer05) : null,
  };

  return parsedData;
}

export async function updateCut(cutId: string, updates: CutUpdate) {
  console.log('Updating cut:', cutId);
  console.log('Update data:', {
    ...updates,
    hasDrawing: !!updates.drawing,
    drawingSize: updates.drawing?.length,
    layersCount: updates.layers_data?.length
  });

  try {
    const { error } = await supabase
      .from('cuts')
      .update({
        ...updates,
      })
      .eq('id', cutId);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Cut updated successfully');
  } catch (error) {
    console.error('Error in updateCut:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
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
    drawing,
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

interface SaveCutData {
  id?: string;
  comic_id?: string;
  layers_data: LayerData[];
  drawing: string;
  background_color: string;
}

export const saveCut = async (cutData: SaveCutData) => {
  console.log('saveCut called with:', {
    id: cutData.id,
    comic_id: cutData.comic_id,
    layersCount: cutData.layers_data.length,
    drawingSize: cutData.drawing.length,
    background_color: cutData.background_color
  });

  if (!cutData.id && !cutData.comic_id) {
    console.error('Missing both id and comic_id');
    throw new Error('Either id or comic_id must be provided');
  }

  try {
    console.log('Sending upsert request to supabase...');
    const { data, error } = await supabase
      .from('cuts')
      .upsert({
        id: cutData.id,
        comic_id: cutData.comic_id,
        layers_data: cutData.layers_data,
        drawing: cutData.drawing,
        background_color: cutData.background_color,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Save successful, returned data:', data);
    return data;
  } catch (error) {
    console.error('Error in saveCut:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};