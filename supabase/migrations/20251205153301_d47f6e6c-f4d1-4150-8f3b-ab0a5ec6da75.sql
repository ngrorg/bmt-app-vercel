-- Add department column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN department text;

-- Create index for department queries
CREATE INDEX idx_profiles_department ON public.profiles(department);