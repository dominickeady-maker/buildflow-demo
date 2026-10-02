import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─── Email helpers (inlined) ──────────────────────────────────────────────────

interface EmailBranding {
  displayName: string;
  logoUrl: string | null;
  primaryColor: string;
  fromName: string;
}

function buildEmailHTML(innerContent: string, branding: EmailBranding, footerText: string): string {
  const pc = branding.primaryColor || "#ff7a2e";
  const logoHtml = branding.logoUrl
    ? `<img src="${branding.logoUrl}" alt="${branding.displayName}" style="max-height:48px;max-width:200px;margin:0 auto 24px;display:block" />`
    : `<div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:${pc};text-align:center;margin-bottom:24px">${branding.displayName}</div>`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${branding.displayName}</title></head><body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:24px 12px"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:560px;width:100%;box-shadow:0 1px 3px rgba(0,0,0,0.08)"><tr><td style="background:#0d1120;padding:28px 24px;text-align:center">${logoHtml}</td></tr><tr><td style="padding:32px 28px">${innerContent}</td></tr><tr><td style="padding:20px 28px 28px;border-top:1px solid #e5e7eb"><p style="margin:0;font-size:12px;color:#6b7280;text-align:center;line-height:1.5">${footerText}<br/><strong style="color:${pc}">Powered by Banksman</strong> &mdash; Directing every job, every day.</p></td></tr></table><p style="margin:16px 0 0;font-size:11px;color:#6b7280;text-align:center">This email was sent by Banksman on behalf of ${branding.displayName}.</p></td></tr></table></body></html>`;
}

function buildInviteEmail(linkUrl: string, branding: EmailBranding): { subject: string; html: string } {
  const subject = `You've been invited to join ${branding.displayName} on Banksman`;
  const pc = branding.primaryColor || "#ff7a2e";
  const inner = `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${pc};text-align:center">You're invited!</h1><p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#1a1a2e;text-align:center">You've been invited to join <strong>${branding.displayName}</strong> on Banksman.<br/>Set your password to get started.</p><div style="text-align:center;margin:28px 0"><a href="${linkUrl}" style="display:inline-block;background:${pc};color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px">Set my password</a></div><div style="background:#f0f4ff;border-radius:10px;padding:16px 20px;margin:24px 0"><p style="margin:0;font-size:14px;color:#374151;line-height:1.5"><strong>Tip:</strong> Open this link on your phone and tap <em>Add to Home Screen</em> to install Banksman as an app.</p></div><p style="margin:24px 0 0;font-size:13px;color:#6b7280;text-align:center">If you didn't expect this invite, you can safely ignore this email.</p>`;
  return { subject, html: buildEmailHTML(inner, branding, `This invite was sent by ${branding.displayName}.`) };
}

function buildResetEmail(linkUrl: string, branding: EmailBranding): { subject: string; html: string } {
  const subject = `Reset your password — ${branding.displayName}`;
  const pc = branding.primaryColor || "#ff7a2e";
  const inner = `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${pc};text-align:center">Reset your password</h1><p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#1a1a2e;text-align:center">We received a request to reset your password for your <strong>${branding.displayName}</strong> account.</p><div style="text-align:center;margin:28px 0"><a href="${linkUrl}" style="display:inline-block;background:${pc};color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px">Reset my password</a></div><p style="margin:20px 0 0;font-size:14px;color:#6b7280;text-align:center">This link only works once. If you didn't request a reset, you can safely ignore this email.</p>`;
  return { subject, html: buildEmailHTML(inner, branding, `This reset link was requested for ${branding.displayName}.`) };
}

async function sendEmailWithSmtp(to: string, subject: string, html: string, branding: EmailBranding): Promise<void> {
  const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!gmailPassword) throw new Error("GMAIL_APP_PASSWORD secret is not configured");
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: "dom@dm4u.ai", pass: gmailPassword },
  });
  const fromName = branding.fromName || "Banksman";
  await transporter.sendMail({
    from: `${fromName} <dom@dm4u.ai>`,
    to,
    subject,
    html,
  });
  transporter.close();
}

// ─── Main handler ──────────────────────────────────────────────────────────────

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
      return new Response(JSON.stringify({ error: "Email is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Please enter a valid email address. Disposable or test emails are not allowed." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: callerData, error: callerError } = await anonClient.auth.getUser(token);
    if (callerError || !callerData.user) {
      return new Response(JSON.stringify({ error: "Could not verify caller identity" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: managerProfile } = await adminClient.from("profiles").select("id, role, organization_id").eq("id", callerData.user.id).maybeSingle();
    if (!managerProfile || managerProfile.role !== "manager") {
      return new Response(JSON.stringify({ error: "Only managers can invite workers" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const orgId = managerProfile.organization_id;
    const { data: org } = await adminClient.from("organizations").select("display_name, logo_url, primary_color, subdomain, name").eq("id", orgId).maybeSingle();
    const branding: EmailBranding = {
      displayName: org?.display_name || org?.name || "Banksman",
      logoUrl: org?.logo_url || null,
      primaryColor: org?.primary_color || "#ff7a2e",
      fromName: `${org?.display_name || org?.name || "Banksman"} via Banksman`,
    };
    const subdomain = org?.subdomain || "app";
    const redirectTo = `https://${subdomain}.banksman.app/auth/confirm`;

    // Handle resend
    if (resend) {
      const { data: existingProfile } = await adminClient.from("profiles").select("id, email, invite_pending, full_name").eq("email", email).eq("organization_id", orgId).maybeSingle();
      if (!existingProfile) {
        return new Response(JSON.stringify({ error: "No worker found with that email in your organisation" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink("invite", email, { redirectTo });
      if (linkError || !linkData) {
        const { data: recoveryData, error: recoveryError } = await adminClient.auth.admin.generateLink("recovery", email, { redirectTo });
        if (recoveryError || !recoveryData) {
          return new Response(JSON.stringify({ error: "Failed to resend invite: " + (recoveryError?.message || "unknown error") }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const actionLink = recoveryData.properties?.action_link || recoveryData.properties?.verification_url;
        if (actionLink) {
          const { subject, html } = buildResetEmail(actionLink, branding);
          await sendEmailWithSmtp(email, subject, html, branding);
        }
      } else {
        const actionLink = linkData.properties?.action_link || linkData.properties?.verification_url;
        if (actionLink) {
          const { subject, html } = buildInviteEmail(actionLink, branding);
          await sendEmailWithSmtp(email, subject, html, branding);
        }
      }

      await adminClient.from("profiles").update({ invite_pending: true }).eq("id", existingProfile.id);
      return new Response(JSON.stringify({ success: true, resent: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // New invite
    if (!full_name || typeof full_name !== "string") {
      return new Response(JSON.stringify({ error: "Full name is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: canAdd } = await adminClient.rpc("check_plan_limit", { org_id: orgId });
    if (!canAdd) {
      return new Response(JSON.stringify({ error: "You have reached the user limit for your plan. Contact your platform admin to upgrade." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { full_name, organization_id: orgId },
    });

    if (inviteError) {
      if (inviteError.message.includes("already been registered") || inviteError.message.includes("already exists")) {
        return new Response(JSON.stringify({ error: "A user with this email already exists" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: inviteError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = inviteData.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Invite sent but no user ID returned" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Send branded email
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink("invite", email, { redirectTo });
    if (!linkError && linkData) {
      const actionLink = linkData.properties?.action_link || linkData.properties?.verification_url;
      if (actionLink) {
        const { subject, html } = buildInviteEmail(actionLink, branding);
        try { await sendEmailWithSmtp(email, subject, html, branding); }
        catch (emailErr) { console.error("Custom email failed:", emailErr.message); }
      }
    }

    const { error: workerProfileError } = await adminClient.from("profiles").upsert({ id: userId, email, full_name, role: "worker", organization_id: orgId, invite_pending: true }, { onConflict: "id" });
    if (workerProfileError) {
      return new Response(JSON.stringify({ error: "Auth user created but profile creation failed: " + workerProfileError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
