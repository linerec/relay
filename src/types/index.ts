export interface Comic {
  id: string;
  title: string;
  owner_id: string;
  created_at: string;
}

export interface Cut {
  id: string;
  comic_id: string;
  order_index: number;
  storyboard_text: string;
  drawing?: string;
  created_by: string;
  created_at: string;
  comics?: Comic;
  profiles?: {
    username: string;
  };
  updated_at: string;
}

export interface CutUpdate {
  storyboard_text?: string;
  drawing?: string;
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