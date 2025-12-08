-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  department TEXT NOT NULL,
  policy_area TEXT NOT NULL,
  responsible_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  version TEXT NOT NULL DEFAULT 'v1.0',
  tags TEXT[] DEFAULT '{}',
  document_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all documents"
ON public.documents
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Other roles can view documents"
ON public.documents
FOR SELECT
USING (
  has_role(auth.uid(), 'driver'::app_role) OR
  has_role(auth.uid(), 'warehouse'::app_role) OR
  has_role(auth.uid(), 'executive'::app_role) OR
  has_role(auth.uid(), 'operational_lead'::app_role)
);

-- Add updated_at trigger
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies
CREATE POLICY "Admins can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update documents"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');