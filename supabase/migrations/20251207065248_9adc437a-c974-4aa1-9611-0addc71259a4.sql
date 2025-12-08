-- Add placeholder and help_text columns to checklist_template_fields
ALTER TABLE public.checklist_template_fields
ADD COLUMN placeholder TEXT,
ADD COLUMN help_text TEXT;