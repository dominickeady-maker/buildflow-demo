/*
  # Create Drawings Table

  ## Overview
  This migration creates a table for storing architectural drawings that can be uploaded by managers/architects and viewed by tradesmen.

  ## New Tables
  
  ### `drawings`
  - `id` (uuid, primary key) - Unique identifier for each drawing
  - `organization_id` (uuid, foreign key) - Links drawing to organization
  - `site_id` (uuid, foreign key, nullable) - Optional link to specific site
  - `title` (text) - Name/title of the drawing
  - `description` (text, nullable) - Additional details about the drawing
  - `file_url` (text) - URL to the uploaded drawing file in storage
  - `file_type` (text) - File type/extension (pdf, dwg, png, jpg, etc.)
  - `file_size` (bigint) - File size in bytes
  - `category` (text) - Category like "Floor Plans", "Elevations", "Details", "Site Plan", "Electrical", "Plumbing", etc.
  - `uploaded_by` (uuid, foreign key) - User who uploaded the drawing
  - `version` (text, default '1.0') - Version number for tracking revisions
  - `created_at` (timestamptz) - When the drawing was uploaded
  - `updated_at` (timestamptz) - Last modification time

  ## Security
  - Enable RLS on `drawings` table
  - Managers can insert, update, and view all drawings in their organization
  - Workers can only view drawings in their organization
  - All users must be authenticated and belong to the organization

  ## Notes
  - Drawings are stored in Supabase Storage bucket 'drawings'
  - Supports multiple file types: PDF, DWG, PNG, JPG, etc.
  - Can be linked to specific sites or kept as general project drawings
  - Version tracking allows for revision management
*/

-- Create drawings table
CREATE TABLE IF NOT EXISTS drawings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  site_id uuid REFERENCES sites(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  category text NOT NULL DEFAULT 'General',
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  version text DEFAULT '1.0',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;

-- Managers can view all drawings in their organization
CREATE POLICY "Managers can view organization drawings"
  ON drawings
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Workers can view all drawings in their organization
CREATE POLICY "Workers can view organization drawings"
  ON drawings
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Managers can insert drawings
CREATE POLICY "Managers can insert drawings"
  ON drawings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Managers can update drawings in their organization
CREATE POLICY "Managers can update drawings"
  ON drawings
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Managers can delete drawings in their organization
CREATE POLICY "Managers can delete drawings"
  ON drawings
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_drawings_organization ON drawings(organization_id);
CREATE INDEX IF NOT EXISTS idx_drawings_site ON drawings(site_id);
CREATE INDEX IF NOT EXISTS idx_drawings_category ON drawings(category);