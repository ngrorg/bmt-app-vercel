import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SeedUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
}

const seedUsers: SeedUser[] = [
  {
    email: 'admin@bmtops.com',
    password: 'password',
    firstName: 'Administrator',
    lastName: '',
    role: 'admin',
    department: 'Administration',
  },
  {
    email: 'driver@bmtops.com',
    password: 'password',
    firstName: 'John',
    lastName: 'Smith',
    role: 'driver',
    department: 'Transport',
  },
  {
    email: 'warehouse@bmtops.com',
    password: 'password',
    firstName: 'Mike',
    lastName: 'Brown',
    role: 'warehouse',
    department: 'Warehouse',
  },
  {
    email: 'executive@bmtops.com',
    password: 'password',
    firstName: 'Emma',
    lastName: 'Davis',
    role: 'executive',
    department: 'Operations',
  },
  {
    email: 'opslead@bmtops.com',
    password: 'password',
    firstName: 'David',
    lastName: 'Wilson',
    role: 'operational_lead',
    department: 'Operations',
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Starting seed process for all roles...');

    const results: { email: string; status: string; userId?: string }[] = [];

    for (const seedUser of seedUsers) {
      console.log(`Processing user: ${seedUser.email}`);

      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === seedUser.email);

      if (existingUser) {
        console.log(`User ${seedUser.email} already exists`);
        results.push({ email: seedUser.email, status: 'already_exists', userId: existingUser.id });
        continue;
      }

      // Create the user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: seedUser.email,
        password: seedUser.password,
        email_confirm: true,
        user_metadata: {
          first_name: seedUser.firstName,
          last_name: seedUser.lastName,
        }
      });

      if (createError) {
        console.error(`Error creating user ${seedUser.email}:`, createError);
        results.push({ email: seedUser.email, status: `error: ${createError.message}` });
        continue;
      }

      console.log(`User ${seedUser.email} created with ID: ${newUser.user.id}`);

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: newUser.user.id,
          first_name: seedUser.firstName,
          last_name: seedUser.lastName,
          department: seedUser.department,
        });

      if (profileError) {
        console.error(`Error creating profile for ${seedUser.email}:`, profileError);
      }

      // Assign role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: seedUser.role,
        });

      if (roleError) {
        console.error(`Error assigning role for ${seedUser.email}:`, roleError);
      }

      results.push({ email: seedUser.email, status: 'created', userId: newUser.user.id });
    }

    console.log('Seed process completed');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Seed process completed',
      results,
    }), {
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
