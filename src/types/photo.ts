export interface Photo {
  id: string;
  user_id: string;
  image_url: string;
  thumbnail_url: string;
  description?: string;
  task_id?: string;
  issues: string[];
  ai_processing: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  site_id: string;
  assigned_to?: string;
}
