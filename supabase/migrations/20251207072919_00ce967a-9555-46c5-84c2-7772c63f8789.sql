-- Create enum for department assignment
CREATE TYPE public.department_type AS ENUM ('transport', 'warehouse');

-- Add assigned_to column to task_submissions
ALTER TABLE public.task_submissions
ADD COLUMN assigned_to public.department_type DEFAULT 'transport';

-- Drop existing view policies that need updating
DROP POLICY IF EXISTS "Drivers can manage own submissions" ON public.task_submissions;
DROP POLICY IF EXISTS "Other roles can view all submissions" ON public.task_submissions;

-- Recreate driver policy to only see transport submissions
CREATE POLICY "Drivers can view transport submissions"
ON public.task_submissions
FOR SELECT
USING (
  has_role(auth.uid(), 'driver'::app_role) 
  AND assigned_to = 'transport'
  AND (
    submitted_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM task_attachments ta
      JOIN tasks t ON t.id = ta.task_id
      WHERE ta.id = task_submissions.task_attachment_id
      AND t.assigned_driver_id = auth.uid()
    )
  )
);

-- Drivers can still manage their own submissions
CREATE POLICY "Drivers can manage own submissions"
ON public.task_submissions
FOR ALL
USING (
  has_role(auth.uid(), 'driver'::app_role) 
  AND submitted_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'driver'::app_role) 
  AND submitted_by = auth.uid()
);

-- Warehouse can view warehouse submissions
CREATE POLICY "Warehouse can view warehouse submissions"
ON public.task_submissions
FOR SELECT
USING (
  has_role(auth.uid(), 'warehouse'::app_role) 
  AND assigned_to = 'warehouse'
);

-- Executive and operational lead can view all submissions
CREATE POLICY "Executive and operational lead can view all submissions"
ON public.task_submissions
FOR SELECT
USING (
  has_role(auth.uid(), 'executive'::app_role) 
  OR has_role(auth.uid(), 'operational_lead'::app_role)
);