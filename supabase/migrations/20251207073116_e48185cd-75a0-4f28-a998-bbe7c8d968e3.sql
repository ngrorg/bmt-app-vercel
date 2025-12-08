-- First drop the policies that depend on the column
DROP POLICY IF EXISTS "Drivers can view transport submissions" ON public.task_submissions;
DROP POLICY IF EXISTS "Warehouse can view warehouse submissions" ON public.task_submissions;
DROP POLICY IF EXISTS "Executive and operational lead can view all submissions" ON public.task_submissions;

-- Now drop the column from task_submissions
ALTER TABLE public.task_submissions DROP COLUMN IF EXISTS assigned_to;

-- Add to task_attachments
ALTER TABLE public.task_attachments
ADD COLUMN assigned_to public.department_type DEFAULT 'transport';

-- Recreate the original policies for task_submissions
CREATE POLICY "Other roles can view all submissions"
ON public.task_submissions
FOR SELECT
USING (
  has_role(auth.uid(), 'warehouse'::app_role) 
  OR has_role(auth.uid(), 'executive'::app_role) 
  OR has_role(auth.uid(), 'operational_lead'::app_role)
);

-- Update task_attachments RLS to include assigned_to filtering
DROP POLICY IF EXISTS "Drivers can view attachments for assigned tasks" ON public.task_attachments;

CREATE POLICY "Drivers can view transport attachments for assigned tasks"
ON public.task_attachments
FOR SELECT
USING (
  has_role(auth.uid(), 'driver'::app_role) 
  AND assigned_to = 'transport'
  AND EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_attachments.task_id
    AND tasks.assigned_driver_id = auth.uid()
  )
);

-- Update other roles policy for task_attachments
DROP POLICY IF EXISTS "Other roles can view all task attachments" ON public.task_attachments;

CREATE POLICY "Warehouse can view warehouse attachments"
ON public.task_attachments
FOR SELECT
USING (
  has_role(auth.uid(), 'warehouse'::app_role)
  AND assigned_to = 'warehouse'
);

CREATE POLICY "Executive and operational lead can view all attachments"
ON public.task_attachments
FOR SELECT
USING (
  has_role(auth.uid(), 'executive'::app_role) 
  OR has_role(auth.uid(), 'operational_lead'::app_role)
);