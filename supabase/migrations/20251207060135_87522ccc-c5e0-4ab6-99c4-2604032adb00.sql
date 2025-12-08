-- Create suppliers table for storing unique supplier names
CREATE TABLE public.suppliers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view suppliers
CREATE POLICY "Authenticated users can view suppliers"
ON public.suppliers
FOR SELECT
TO authenticated
USING (true);

-- Admins can manage suppliers
CREATE POLICY "Admins can manage suppliers"
ON public.suppliers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed initial suppliers
INSERT INTO public.suppliers (name) VALUES 
    ('Supplier A'),
    ('Supplier B'),
    ('Supplier C')
ON CONFLICT (name) DO NOTHING;