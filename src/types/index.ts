export interface Comic {
  id: string;
  title: string;
  owner_id: string;
  created_at: string;
  collaborators?: string[];
}

export interface Cut {
  id: string;
  comic_id: string;
  order_index: number;
  storyboard_text: string;
  drawing?: string;
  background_color?: string;
  layers_data?: LayerData[];
  created_by: string;
  created_at: string;
  comics?: Comic;
  profiles?: {
    username: string;
  };
  updated_at: string;
}

export interface LayerData {
  id: string;
  imageData: string;
  name: string;
  sequence: number;
  visible: boolean;
  opacity: number;
  locked: boolean;
}

export interface CutUpdate {
  storyboard_text?: string;
  drawing?: string;
  background_color?: string;
  layers_data?: LayerData[];
}

export interface User {
  id: string;
  email: string;
}

export interface Profile {
  id: string;
  username: string;
  email?: string;
}

export interface Comment {
  id: string;
  comic_id: string;
  parent_id: string | null;
  user_id: string;
  user_username: string;
  content: string;
  created_at: string;
  updated_at: string;
}