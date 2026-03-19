// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const TMDB_API_KEY = "87ac1ac60056408dd1f46c65dbfc4a1f";
const BASE_URL = "https://api.themoviedb.org/3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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

    // Construct the TMDB URL
    const tmdbUrl = new URL(`${BASE_URL}${path}`);
    tmdbUrl.searchParams.set('api_key', TMDB_API_KEY);
    
    // Forward all other search params
    url.searchParams.forEach((value, key) => {
      if (key !== 'path') {
        tmdbUrl.searchParams.set(key, value);
      }
    });

    console.log(`[tmdb-proxy] Fetching: ${tmdbUrl.toString()}`);

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