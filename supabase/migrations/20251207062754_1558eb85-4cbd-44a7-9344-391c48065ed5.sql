-- Enum for field types in dynamic forms
CREATE TYPE public.field_type AS ENUM (
  'text', 'textarea', 'number', 'date', 'checkbox', 
  'radio', 'select', 'file', 'signature'
);

-- Enum for submission status
CREATE TYPE public.submission_status AS ENUM (
  'pending', 'submitted', 'approved', 'rejected', 'flagged'
);

-- 1. Checklist Templates (reusable form definitions)
CREATE TABLE public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for checklist_templates
CREATE POLICY "Admins can manage checklist templates"
ON public.checklist_templates FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view checklist templates"
ON public.checklist_templates FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_checklist_templates_updated_at
BEFORE UPDATE ON public.checklist_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Template Fields (defines form structure)
CREATE TABLE public.checklist_template_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type public.field_type NOT NULL DEFAULT 'text',
  is_required BOOLEAN NOT NULL DEFAULT false,
  options JSONB,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checklist_template_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies for checklist_template_fields
CREATE POLICY "Admins can manage template fields"
ON public.checklist_template_fields FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view template fields"
ON public.checklist_template_fields FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Index for faster lookups
CREATE INDEX idx_template_fields_template_id ON public.checklist_template_fields(template_id);
CREATE INDEX idx_template_fields_order ON public.checklist_template_fields(template_id, display_order);

-- 3. Task Attachments (links checklists/documents to tasks)
CREATE TABLE public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('checklist', 'document')),
  title TEXT NOT NULL,
  checklist_template_id UUID REFERENCES public.checklist_templates(id),
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_attachments
CREATE POLICY "Admins can manage task attachments"
ON public.task_attachments FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can view attachments for assigned tasks"
ON public.task_attachments FOR SELECT
USING (
  has_role(auth.uid(), 'driver') AND 
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_attachments.task_id 
    AND tasks.assigned_driver_id = auth.uid()
  )
);

CREATE POLICY "Other roles can view all task attachments"
ON public.task_attachments FOR SELECT
USING (
  has_role(auth.uid(), 'warehouse') OR 
  has_role(auth.uid(), 'executive') OR 
  has_role(auth.uid(), 'operational_lead')
);

-- Indexes
CREATE INDEX idx_task_attachments_task_id ON public.task_attachments(task_id);
CREATE INDEX idx_task_attachments_template_id ON public.task_attachments(checklist_template_id);

-- 4. Task Submissions (actual responses)
CREATE TABLE public.task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_attachment_id UUID NOT NULL REFERENCES public.task_attachments(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES auth.users(id),
  submitted_by_name TEXT,
  status public.submission_status NOT NULL DEFAULT 'pending',
  form_data JSONB,
  file_path TEXT,
  file_name TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  reviewer_comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_submissions
CREATE POLICY "Admins can manage all submissions"
ON public.task_submissions FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can manage own submissions"
ON public.task_submissions FOR ALL
USING (
  has_role(auth.uid(), 'driver') AND submitted_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'driver') AND submitted_by = auth.uid()
);

CREATE POLICY "Drivers can insert submissions for assigned tasks"
ON public.task_submissions FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'driver') AND 
  EXISTS (
    SELECT 1 FROM public.task_attachments ta
    JOIN public.tasks t ON t.id = ta.task_id
    WHERE ta.id = task_submissions.task_attachment_id
    AND t.assigned_driver_id = auth.uid()
  )
);

CREATE POLICY "Warehouse and operational lead can review submissions"
ON public.task_submissions FOR UPDATE
USING (
  has_role(auth.uid(), 'warehouse') OR 
  has_role(auth.uid(), 'operational_lead')
);

CREATE POLICY "Other roles can view all submissions"
ON public.task_submissions FOR SELECT
USING (
  has_role(auth.uid(), 'warehouse') OR 
  has_role(auth.uid(), 'executive') OR 
  has_role(auth.uid(), 'operational_lead')
);

-- Trigger for updated_at
CREATE TRIGGER update_task_submissions_updated_at
BEFORE UPDATE ON public.task_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_task_submissions_attachment_id ON public.task_submissions(task_attachment_id);
CREATE INDEX idx_task_submissions_submitted_by ON public.task_submissions(submitted_by);
CREATE INDEX idx_task_submissions_status ON public.task_submissions(status);