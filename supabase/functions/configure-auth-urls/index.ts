/**
 * One-shot edge function to configure Supabase auth URL settings.
 * Call once with your Personal Access Token (PAT) from supabase.com/dashboard/account/tokens
 *
 * POST /configure-auth-urls
 * Authorization: Bearer <your-supabase-PAT>
 * (no body needed — URLs are hardcoded to the correct values)
 *
 * Delete this function after running it.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PROJECT_REF = "jpujykkjrskihqskbovu";

const AUTH_CONFIG = {
  site_url: "https://app.banksman.app",
  additional_redirect_urls: [
    "https://app.banksman.app/**",
    "https://*.banksman.app/**",
    "https://buildflowdemo123.netlify.app/**",
  ].join(","),
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Require a PAT in the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authorization: Bearer <your-supabase-PAT> header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pat = authHeader.replace("Bearer ", "").trim();

    // Call the Supabase Management API
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${pat}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(AUTH_CONFIG),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Management API error", status: response.status, detail: result }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        applied: {
          site_url: result.site_url,
          additional_redirect_urls: result.additional_redirect_urls,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
