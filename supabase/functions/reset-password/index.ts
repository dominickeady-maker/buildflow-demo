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

const GENERIC_MSG = { success: true, message: "If that email exists, we've sent a reset link." };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { email, redirect_url } = body;

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Determine branding from the user's org
    let displayName = "Banksman";
    let logoUrl: string | null = null;
    let primaryColor = "#ff7a2e";
    let fromName = "Banksman";
    let subdomain = "app";

    const { data: profileData } = await adminClient.from("profiles").select("id, organization_id").eq("email", email).maybeSingle();

    if (profileData?.organization_id) {
      const { data: orgData } = await adminClient.from("organizations").select("display_name, logo_url, primary_color, subdomain, name").eq("id", profileData.organization_id).maybeSingle();
      if (orgData) {
        displayName = orgData.display_name || orgData.name || "Banksman";
        logoUrl = orgData.logo_url || null;
        primaryColor = orgData.primary_color || "#ff7a2e";
        subdomain = orgData.subdomain || "app";
        fromName = `${displayName} via Banksman`;
      }
    }

    const branding: EmailBranding = { displayName, logoUrl, primaryColor, fromName };

    let finalRedirect: string;
    if (redirect_url && isAllowedRedirectUrl(redirect_url)) {
      const parsed = new URL(redirect_url);
      parsed.pathname = "/auth/confirm"; parsed.search = ""; parsed.hash = "";
      finalRedirect = parsed.toString();
    } else {
      finalRedirect = `https://${subdomain}.banksman.app/auth/confirm`;
    }

    // Check if user exists
    const { data: userList } = await adminClient.auth.admin.listUsers();
    const existingUser = userList?.users?.find((u) => u.email === email);

    if (!existingUser) {
      return new Response(JSON.stringify(GENERIC_MSG), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate a recovery link
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink("recovery", email, { redirectTo: finalRedirect });

    if (linkError || !linkData) {
      return new Response(JSON.stringify(GENERIC_MSG), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const actionLink = linkData.properties?.action_link || linkData.properties?.verification_url;
    if (!actionLink) {
      return new Response(JSON.stringify(GENERIC_MSG), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { subject, html } = buildResetEmail(actionLink, branding);
    await sendEmailWithSmtp(email, subject, html, branding);

    return new Response(JSON.stringify(GENERIC_MSG), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
