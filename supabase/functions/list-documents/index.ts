import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    
    // Create client with user's token for RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    // Parse query parameters
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const department = url.searchParams.get('department') || '';
    const status = url.searchParams.get('status') || '';
    const policyArea = url.searchParams.get('policyArea') || '';

    console.log('Fetching documents with filters:', { search, department, status, policyArea });

    // Build query
    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,file_name.ilike.%${search}%`);
    }
    if (department) {
      query = query.eq('department', department);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (policyArea) {
      query = query.eq('policy_area', policyArea);
    }

    const { data: documents, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${documents?.length || 0} documents`);

    return new Response(JSON.stringify({ documents: documents || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
