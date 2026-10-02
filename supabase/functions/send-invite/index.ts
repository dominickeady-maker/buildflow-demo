import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─── Email helpers (inlined — edge functions can't share files) ───────────────

interface EmailBranding {
  displayName: string;
  logoUrl: string | null;
  primaryColor: string;
  fromName: string;
}

function buildEmailHTML(innerContent: string, branding: EmailBranding, footerText: string): string {
  const primaryColor = branding.primaryColor || "#ff7a2e";
  const logoHtml = branding.logoUrl
    ? `<img src="${branding.logoUrl}" alt="${branding.displayName}" style="max-height:48px;max-width:200px;margin:0 auto 24px;display:block" />`
    : `<div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:${primaryColor};text-align:center;margin-bottom:24px">${branding.displayName}</div>`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${branding.displayName}</title></head><body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:24px 12px"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:560px;width:100%;box-shadow:0 1px 3px rgba(0,0,0,0.08)"><tr><td style="background:#0d1120;padding:28px 24px;text-align:center">${logoHtml}</td></tr><tr><td style="padding:32px 28px">${innerContent}</td></tr><tr><td style="padding:20px 28px 28px;border-top:1px solid #e5e7eb"><p style="margin:0;font-size:12px;color:#6b7280;text-align:center;line-height:1.5">${footerText}<br/><strong style="color:${primaryColor}">Powered by Banksman</strong> &mdash; Directing every job, every day.</p></td></tr></table><p style="margin:16px 0 0;font-size:11px;color:#6b7280;text-align:center">This email was sent by Banksman on behalf of ${branding.displayName}.</p></td></tr></table></body></html>`;
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

const ALLOWED_REDIRECT_HOSTS = [
  /^app\.banksman\.app$/,
  /^[a-z0-9-]+\.banksman\.app$/,
  /^buildflowdemo123\.netlify\.app$/,
  /^localhost$/,
  /^127\.0\.0\.1$/,
];

function isAllowedRedirectUrl(urlStr: string): boolean {
  try { const url = new URL(urlStr); return ALLOWED_REDIRECT_HOSTS.some((re) => re.test(url.hostname)); }
  catch { return false; }
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
    const { email, redirect_url, org_id, full_name } = body;

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!org_id || typeof org_id !== "string") {
      return new Response(JSON.stringify({ error: "org_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get org branding
    const { data: org } = await adminClient.from("organizations").select("display_name, logo_url, primary_color, subdomain, name").eq("id", org_id).maybeSingle();
    const branding: EmailBranding = {
      displayName: org?.display_name || org?.name || "Banksman",
      logoUrl: org?.logo_url || null,
      primaryColor: org?.primary_color || "#ff7a2e",
      fromName: `${org?.display_name || org?.name || "Banksman"} via Banksman`,
    };
    const subdomain = org?.subdomain || "app";

    let finalRedirectUrl: string;
    if (redirect_url && isAllowedRedirectUrl(redirect_url)) {
      const parsed = new URL(redirect_url);
      parsed.pathname = "/auth/confirm"; parsed.search = ""; parsed.hash = "";
      finalRedirectUrl = parsed.toString();
    } else {
      finalRedirectUrl = `https://${subdomain}.banksman.app/auth/confirm`;
    }

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: finalRedirectUrl,
      data: full_name ? { full_name, organization_id: org_id } : { organization_id: org_id },
    });

    let userId: string | undefined;
    let actionLink: string | undefined;

    if (inviteError) {
      if (inviteError.message.includes("already been registered") || inviteError.message.includes("already exists")) {
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink("recovery", email, { redirectTo: finalRedirectUrl });
        if (linkError || !linkData) {
          return new Response(JSON.stringify({ error: linkError?.message || "Failed to generate reset link" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        actionLink = linkData.properties?.action_link || linkData.properties?.verification_url;
        const { data: userData } = await adminClient.auth.admin.listUsers();
        const existingUser = userData?.users?.find((u) => u.email === email);
        userId = existingUser?.id;
      } else {
        return new Response(JSON.stringify({ error: inviteError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      userId = inviteData.user?.id;
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink("invite", email, { redirectTo: finalRedirectUrl });
      if (!linkError && linkData) {
        actionLink = linkData.properties?.action_link || linkData.properties?.verification_url;
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Invite succeeded but no user ID returned" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (actionLink) {
      const { subject, html } = buildInviteEmail(actionLink, branding);
      try { await sendEmailWithSmtp(email, subject, html, branding); }
      catch (emailErr) { console.error("Custom email failed:", emailErr.message); }
    }

    const { error: profileError } = await adminClient.from("profiles").upsert({ id: userId, email, full_name: full_name || null, role: "manager", organization_id: org_id }, { onConflict: "id" });
    if (profileError) {
      return new Response(JSON.stringify({ error: `Invite sent but profile creation failed: ${profileError.message}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
// force redeploy
