-- Add 'paragraph' to the field_type enum for display-only rich text content
ALTER TYPE public.field_type ADD VALUE IF NOT EXISTS 'paragraph';