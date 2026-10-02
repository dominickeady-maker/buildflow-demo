// © 2026 DM.AI 4U. All rights reserved. Unauthorised copying prohibited.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'worker' | 'manager';
  organization_id: string | null;
  is_platform_admin: boolean;
  invite_pending?: boolean;
  avatar_url?: string | null;
  text_size?: 'normal' | 'large' | 'extra_large';
  created_at: string;
  updated_at: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  display_name: string | null;
  logo_url: string | null;
  primary_color: string;
  subdomain: string | null;
  custom_domain: string | null;
  account_number: string | null;
  plan: string;
  max_users: number;
  active: boolean;
  is_internal: boolean;
  created_at: string;
};

export type Site = {
  id: string;
  name: string;
  description: string;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Trade = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  site_id: string;
  trade_id: string | null;
  title: string;
  description: string;
  assigned_to: string | null;
  status: 'todo' | 'in_progress' | 'complete';
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
  site?: Site;
  trade?: Trade;
  assignee?: Profile;
};

export type Material = {
  id: string;
  site_id: string;
  item_name: string;
  quantity: number;
  comment: string;
  requested_by: string;
  status: 'new' | 'approved' | 'ordered' | 'delivered';
  created_at: string;
  updated_at: string;
  site?: Site;
  requester?: Profile;
};

export type Timesheet = {
  id: string;
  worker_id: string;
  site_id: string;
  plot_number: string;
  work_type: 'price' | 'daywork';
  task_description: string;
  hours_worked: number | null;
  pricework_amount: number | null;
  date_worked: string;
  notes: string;
  created_at: string;
  updated_at: string;
  site?: Site;
  worker?: Profile;
};

export type ProgrammeMilestone = {
  id: string;
  organization_id: string;
  site_id: string;
  milestone_name: string;
  sort_order: number;
  target_date: string | null;
  actual_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Drawing = {
  id: string;
  organization_id: string;
  site_id: string | null;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size: number;
  category: string;
  uploaded_by: string | null;
  version: string;
  created_at: string;
  updated_at: string;
  site?: Site;
  uploader?: Profile;
};
