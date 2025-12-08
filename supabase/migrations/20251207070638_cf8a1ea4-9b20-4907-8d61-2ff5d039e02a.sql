-- Add layout_config column to checklist_templates to store layout configuration
ALTER TABLE public.checklist_templates
ADD COLUMN layout_config jsonb DEFAULT '[]'::jsonb;