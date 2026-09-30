import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Only allow redirects to known Banksman domains
const ALLOWED_REDIRECT_HOSTS = [
  /^app\.banksman\.app$/,
  /^[a-z0-9-]+\.banksman\.app$/,
  /^buildflowdemo123\.netlify\.app$/,
  /^localhost$/,
  /^127\.0\.0\.1$/,
];

function isAllowedRedirectUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return ALLOWED_REDIRECT_HOSTS.some((re) => re.test(url.hostname));
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { email, redirect_url } = body;

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and normalise the redirect URL.
    // Always land on /auth/confirm — strip any path the caller provided and
    // replace it, so even a misconfigured caller can't redirect elsewhere.
    let finalRedirectUrl: string | undefined;
    if (redirect_url) {
      if (!isAllowedRedirectUrl(redirect_url)) {
        return new Response(
          JSON.stringify({ error: "redirect_url must be a banksman.app or approved domain" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Force path to /auth/confirm regardless of what the caller passed
      const parsed = new URL(redirect_url);
      parsed.pathname = "/auth/confirm";
      parsed.search = "";
      parsed.hash = "";
      finalRedirectUrl = parsed.toString();
    }

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo: finalRedirectUrl,
      },
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, properties: data.properties }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
