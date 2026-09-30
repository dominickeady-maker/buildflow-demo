import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DISPOSABLE_DOMAINS = [
  "test.com", "example.com", "example.org", "example.net",
  "mailinator.com", "guerrillamail.com", "tempmail.com", "tempmail.net",
  "throwaway.email", "trashmail.com", "yopmail.com", "sharklasers.com",
  "guerrillamail.info", "grr.la", "dispostable.com", "fakemail.net",
  "fakeinbox.com", "maildrop.cc", "mintemail.com", "mohmal.com",
  "getnada.com", "temp-mail.org", "emailondeck.com", "10minutemail.com",
];

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  const domain = email.split("@")[1].toLowerCase();
  if (DISPOSABLE_DOMAINS.includes(domain)) return false;
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { email, full_name, resend } = body;

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid email address. Disposable or test emails are not allowed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Identify the calling manager from their JWT.
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: callerData, error: callerError } = await anonClient.auth.getUser(token);
    if (callerError || !callerData.user) {
      return new Response(
        JSON.stringify({ error: "Could not verify caller identity" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerId = callerData.user.id;

    const { data: managerProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, role, organization_id")
      .eq("id", callerId)
      .maybeSingle();

    if (profileError || !managerProfile) {
      return new Response(
        JSON.stringify({ error: "Could not load caller profile" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (managerProfile.role !== "manager") {
      return new Response(
        JSON.stringify({ error: "Only managers can invite workers" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orgId = managerProfile.organization_id;

    // Get the org subdomain for the redirect URL.
    const { data: org } = await adminClient
      .from("organizations")
      .select("subdomain")
      .eq("id", orgId)
      .maybeSingle();

    const subdomain = org?.subdomain || "app";
    const redirectTo = `https://${subdomain}.banksman.app/auth/confirm`;

    // Handle resend invite
    if (resend) {
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id, email, invite_pending")
        .eq("email", email)
        .eq("organization_id", orgId)
        .maybeSingle();

      if (!existingProfile) {
        return new Response(
          JSON.stringify({ error: "No worker found with that email in your organisation" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: { full_name: existingProfile.id },
      });

      if (inviteError) {
        return new Response(
          JSON.stringify({ error: "Failed to resend invite: " + inviteError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, resent: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // New invite flow
    if (!full_name || typeof full_name !== "string") {
      return new Response(
        JSON.stringify({ error: "Full name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check plan limit
    const { data: canAdd, error: planError } = await adminClient
      .rpc("check_plan_limit", { org_id: orgId });

    if (planError) {
      return new Response(
        JSON.stringify({ error: "Could not verify plan limit: " + planError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!canAdd) {
      return new Response(
        JSON.stringify({ error: "You have reached the user limit for your plan. Contact your platform admin to upgrade." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send the invite email. The worker sets their own password from the link.
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { full_name, organization_id: orgId },
    });

    if (inviteError) {
      if (inviteError.message.includes("already been registered") || inviteError.message.includes("already exists")) {
        return new Response(
          JSON.stringify({ error: "A user with this email already exists" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = inviteData.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Invite sent but no user ID returned" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the worker profile linked to the manager's org.
    const { error: workerProfileError } = await adminClient
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          full_name,
          role: "worker",
          organization_id: orgId,
          invite_pending: true,
        },
        { onConflict: "id" }
      );

    if (workerProfileError) {
      return new Response(
        JSON.stringify({ error: "Auth user created but profile creation failed: " + workerProfileError.message }),
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
