import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    const { email, redirect_url, org_id, full_name } = body;

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!org_id || typeof org_id !== "string") {
      return new Response(
        JSON.stringify({ error: "org_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let finalRedirectUrl: string | undefined;
    if (redirect_url) {
      if (!isAllowedRedirectUrl(redirect_url)) {
        return new Response(
          JSON.stringify({ error: "redirect_url must be a banksman.app or approved domain" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const parsed = new URL(redirect_url);
      parsed.pathname = "/auth/confirm";
      parsed.search = "";
      parsed.hash = "";
      finalRedirectUrl = parsed.toString();
    }

    // inviteUserByEmail creates the auth.users row with all GoTrue token
    // columns properly initialised, avoiding the "Database error finding user"
    // issue that occurs when inserting into auth.users via SQL.
    // If the user already exists (e.g. re-inviting), fall back to generateLink
    // with type "recovery" to send a password-set link.
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: finalRedirectUrl,
        data: full_name ? { full_name, organization_id: org_id } : { organization_id: org_id },
      }
    );

    let userId: string | undefined;

    if (inviteError) {
      // User already exists — send a recovery link instead so they can set a password
      if (inviteError.message.includes("already been registered") || inviteError.message.includes("already exists")) {
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: "recovery",
          email,
          options: { redirectTo: finalRedirectUrl },
        });

        if (linkError) {
          return new Response(
            JSON.stringify({ error: linkError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        userId = linkData.user?.id;
      } else {
        return new Response(
          JSON.stringify({ error: inviteError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      userId = inviteData.user?.id;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Invite succeeded but no user ID returned" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create or update the profile linked to this organisation as manager.
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          full_name: full_name || null,
          role: "manager",
          organization_id: org_id,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      return new Response(
        JSON.stringify({ error: `Invite sent but profile creation failed: ${profileError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
