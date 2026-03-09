import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, security_answer, new_password } = await req.json()

    // Initialize Supabase with Service Role Key to bypass RLS for verification
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`[reset-password] Attempting reset for: ${email}`);

    // 1. Verify the security answer
    const { data: securityData, error: verifyError } = await supabaseAdmin
      .from('user_security')
      .select('id')
      .eq('email', email)
      .eq('security_answer', security_answer.toLowerCase().trim())
      .single()

    if (verifyError || !securityData) {
      console.error("[reset-password] Verification failed", verifyError);
      return new Response(JSON.stringify({ error: 'Invalid email or security answer' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Update the user's password in Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      securityData.id,
      { password: new_password }
    )

    if (updateError) {
      console.error("[reset-password] Password update failed", updateError);
      return new Response(JSON.stringify({ error: 'Failed to update password' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ message: 'Password reset successful' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error("[reset-password] Unexpected error", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})