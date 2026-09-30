import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    const { email, password, full_name } = body;

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!full_name || typeof full_name !== "string") {
      return new Response(
        JSON.stringify({ error: "full_name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!password || password.length < 6) {
      return new Response(
        JSON.stringify({ error: "password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Identify the calling manager from their JWT to get their organization_id.
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
        JSON.stringify({ error: "Only managers can create workers" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orgId = managerProfile.organization_id;

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

    // Create the auth user with the specified password (email confirmation off).
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, organization_id: orgId },
    });

    if (authError) {
      if (authError.message.includes("already been registered") || authError.message.includes("already exists")) {
        return new Response(
          JSON.stringify({ error: "A user with this email already exists" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User created but no ID returned" }),
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
