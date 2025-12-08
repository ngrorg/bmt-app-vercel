-- Create enum for task status
CREATE TYPE public.task_status AS ENUM ('new', 'in_progress', 'completed', 'cancelled');

-- Create enum for vehicle type
CREATE TYPE public.vehicle_type AS ENUM ('truck', 'tank');

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  product_name TEXT,
  supplier TEXT NOT NULL,
  number_of_bags INTEGER DEFAULT 0,
  bag_weight DECIMAL(10,2) NOT NULL,
  docket_number TEXT NOT NULL,
  vehicle_type public.vehicle_type NOT NULL DEFAULT 'truck',
  haulier_tanker TEXT NOT NULL,
  planned_decant_date DATE NOT NULL,
  planned_delivery_date DATE NOT NULL,
  assigned_driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_driver_name TEXT,
  status public.task_status NOT NULL DEFAULT 'new',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'driver', 'warehouse', 'executive', 'operational_lead');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for tasks

-- Admins can do everything
CREATE POLICY "Admins can manage all tasks"
ON public.tasks
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drivers can only view their assigned tasks
CREATE POLICY "Drivers can view assigned tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'driver') AND assigned_driver_id = auth.uid()
);

-- Warehouse, Executive, Operational Lead can view all tasks
CREATE POLICY "Other roles can view all tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'warehouse') OR 
  public.has_role(auth.uid(), 'executive') OR 
  public.has_role(auth.uid(), 'operational_lead')
);

-- RLS Policies for user_roles

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can manage all roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create profiles table for user info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();