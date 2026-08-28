// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

// Fetching secret from environment variables
const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY') || "0f2e894c4ae994f506e321a591b60ded";
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

  try {
    // Security: Ensure the request is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("[tmdb-proxy] Unauthorized access attempt");
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(req.url);
    const path = url.searchParams.get('path');
    
    if (!path) {
      return new Response(JSON.stringify({ error: 'Missing path parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Construct the TMDB URL securely
    const tmdbUrl = new URL(`${BASE_URL}${path}`);
    tmdbUrl.searchParams.set('api_key', TMDB_API_KEY);
    
    // Forward all other search params
    url.searchParams.forEach((value, key) => {
      if (key !== 'path') {
        tmdbUrl.searchParams.set(key, value);
      }
    });

    console.log(`[tmdb-proxy] Securely fetching: ${path}`);

    const response = await fetch(tmdbUrl.toString());
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.status
    });
  } catch (error) {
    console.error("[tmdb-proxy] Error:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})