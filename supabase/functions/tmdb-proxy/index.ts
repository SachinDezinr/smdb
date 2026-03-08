// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
const BASE_URL = "https://api.themoviedb.org/3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 1. Verify Authentication (Security Fix #2)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    console.error("[tmdb-proxy] Unauthorized access attempt - No token provided");
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path');
    
    if (!path) {
      return new Response(JSON.stringify({ error: 'Missing path parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Use Environment Variable (Security Fix #4)
    if (!TMDB_API_KEY) {
      console.error("[tmdb-proxy] TMDB_API_KEY is not configured in Edge Function secrets");
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Construct the TMDB URL
    const tmdbUrl = new URL(`${BASE_URL}${path}`);
    tmdbUrl.searchParams.set('api_key', TMDB_API_KEY);
    
    // Forward all other search params
    url.searchParams.forEach((value, key) => {
      if (key !== 'path') {
        tmdbUrl.searchParams.set(key, value);
      }
    });

    console.log(`[tmdb-proxy] Authorized request for: ${path}`);

    const response = await fetch(tmdbUrl.toString());
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.status
    });
  } catch (error) {
    console.error("[tmdb-proxy] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})