import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailBranding {
  displayName: string;
  logoUrl: string | null;
  primaryColor: string;
  fromName: string;
}

function buildEmailHTML(
  innerContent: string,
  branding: EmailBranding,
  footerText: string
): string {
  const pc = branding.primaryColor || "#ff7a2e";
  const logoHtml = branding.logoUrl
    ? `<img src="${branding.logoUrl}" alt="${branding.displayName}" style="max-height:48px;max-width:200px;margin:0 auto 24px;display:block" />`
    : `<div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:${pc};text-align:center;margin-bottom:24px">${branding.displayName}</div>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${branding.displayName}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:24px 12px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:560px;width:100%;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<tr><td style="background:#0d1120;padding:28px 24px;text-align:center">
${logoHtml}
</td></tr>
<tr><td style="padding:32px 28px">
${innerContent}
</td></tr>
<tr><td style="padding:20px 28px 28px;border-top:1px solid #e5e7eb">
<p style="margin:0;font-size:12px;color:#6b7280;text-align:center;line-height:1.5">
${footerText}<br/>
<strong style="color:${pc}">Powered by Banksman</strong> &mdash; Directing every job, every day.
</p>
</td></tr>
</table>
<p style="margin:16px 0 0;font-size:11px;color:#6b7280;text-align:center">
This email was sent by Banksman on behalf of ${branding.displayName}.
</p>
</td></tr>
</table>
</body>
</html>`;
}

export function buildInviteEmail(
  linkUrl: string,
  branding: EmailBranding
): { subject: string; html: string } {
  const subject = `You've been invited to join ${branding.displayName} on Banksman`;
  const pc = branding.primaryColor || "#ff7a2e";
  const inner = `
<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${pc};text-align:center">You're invited!</h1>
<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#1a1a2e;text-align:center">
You've been invited to join <strong>${branding.displayName}</strong> on Banksman.<br/>
Set your password to get started.
</p>
<div style="text-align:center;margin:28px 0">
<a href="${linkUrl}" style="display:inline-block;background:${pc};color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px">
Set my password
</a>
</div>
<div style="background:#f0f4ff;border-radius:10px;padding:16px 20px;margin:24px 0">
<p style="margin:0;font-size:14px;color:#374151;line-height:1.5">
<strong>Tip:</strong> Open this link on your phone and tap <em>Add to Home Screen</em> to install Banksman as an app.
</p>
</div>
<p style="margin:24px 0 0;font-size:13px;color:#6b7280;text-align:center">
If you didn't expect this invite, you can safely ignore this email.
</p>`;
  const footer = `This invite was sent by ${branding.displayName}.`;
  return { subject, html: buildEmailHTML(inner, branding, footer) };
}

export function buildResetEmail(
  linkUrl: string,
  branding: EmailBranding
): { subject: string; html: string } {
  const subject = `Reset your password — ${branding.displayName}`;
  const pc = branding.primaryColor || "#ff7a2e";
  const inner = `
<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${pc};text-align:center">Reset your password</h1>
<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#1a1a2e;text-align:center">
We received a request to reset your password for your <strong>${branding.displayName}</strong> account.
</p>
<div style="text-align:center;margin:28px 0">
<a href="${linkUrl}" style="display:inline-block;background:${pc};color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px">
Reset my password
</a>
</div>
<p style="margin:20px 0 0;font-size:14px;color:#6b7280;text-align:center">
This link only works once. If you didn't request a reset, you can safely ignore this email.
</p>`;
  const footer = `This reset link was requested for ${branding.displayName}.`;
  return { subject, html: buildEmailHTML(inner, branding, footer) };
}

export async function sendEmailWithSmtp(params: {
  to: string;
  subject: string;
  html: string;
  branding: EmailBranding;
}): Promise<void> {
  const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!gmailPassword) {
    throw new Error("GMAIL_APP_PASSWORD secret is not configured");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "dom@dm4u.ai",
      pass: gmailPassword,
    },
  });

  const fromName = params.branding.fromName || "Banksman";

  await transporter.sendMail({
    from: `${fromName} <dom@dm4u.ai>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  transporter.close();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { to, subject, html, branding } = await req.json() as {
      to: string;
      subject: string;
      html: string;
      branding?: EmailBranding;
    };

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "to, subject, and html are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await sendEmailWithSmtp({
      to,
      subject,
      html,
      branding: branding || { displayName: "Banksman", logoUrl: null, primaryColor: "#ff7a2e", fromName: "Banksman" },
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
