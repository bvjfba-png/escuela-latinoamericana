import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Registration = {
  name: string | null;
  email: string;
  messenger: string | null;
  country: string | null;
  language: string | null;
  payment_method: string | null;
  roles: string[];
  talk_title: string | null;
  talk_description: string | null;
  talk_duration: string | null;
  talk_language: string | null;
  source: string | null;
  comment: string | null;
};

const ROLE_LABELS: Record<string, { es: string; ru: string }> = {
  expositor: { es: "Expositor", ru: "Спикер" },
  taller: { es: "Taller / Masterclass", ru: "Мастер-класс" },
  participante: { es: "Participante", ru: "Участник" },
};

const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  telegram: "Telegram",
  colegas: "Colegas / recomendación",
  "gestalt-global": "Gestalt Global",
  otro: "Otro",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  paypal: "PayPal / USD",
  rub: "Rublos / transferencia",
  mercado_pago: "Mercado Pago",
  consultation: "Necesita consultar la forma más conveniente",
};

function formatRoles(roles: string[], lang: string): string {
  return roles
    .map((role) => ROLE_LABELS[role]?.[lang === "ru" ? "ru" : "es"] ?? role)
    .join(", ");
}

function buildParticipantEmail(reg: Registration) {
  const isRu = reg.language === "ru";
  const name = reg.name?.trim() || (isRu ? "участник" : "participante");

  if (isRu) {
    return {
      subject:
        "Escuela Latina de Terapia Gestalt — Подтверждение регистрации",
      html: `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Escuela Latina de Terapia Gestalt — Подтверждение регистрации</title>
</head>
<body style="margin:0; padding:0; background-color:#F2EDE8; font-family: Georgia, 'Times New Roman', serif;">

  <div style="display:none; max-height:0; overflow:hidden; color:#F2EDE8; font-size:1px;">
    Ваша заявка получена — до встречи в Монтевидео ✦
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F2EDE8; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px; width:100%; background-color:#FDFAF7; border-radius:4px; overflow:hidden;">

          <tr>
            <td style="height:4px; background: linear-gradient(to right, #C4A47C, #7A9E9B); font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <tr>
            <td style="padding: 48px 48px 16px;">

              <p style="margin: 0 0 24px; font-family: Georgia, serif; font-size: 22px; font-weight: normal; color: #1A1A1A; line-height: 1.4;">
                Здравствуйте, <span style="color:#7A9E9B;">${escapeHtml(name)}</span>!
              </p>

              <p style="margin: 0 0 16px; font-family: Arial, sans-serif; font-size: 15px; color: #3A3A3A; line-height: 1.7;">
                Спасибо, что зарегистрировались на конференцию.<br>
                Мы получили вашу заявку и скоро свяжемся с вами с дальнейшими деталями.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                     style="margin: 28px 0; background-color:#F7F3EF; border-left: 3px solid #C4A47C; border-radius: 2px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin:0 0 6px; font-family: Arial, sans-serif; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#9A8A7A;">Конференция</p>
                    <p style="margin:0 0 16px; font-family: Georgia, serif; font-size: 17px; color:#1A1A1A; line-height:1.3;">
                      Escuela Latina de Terapia Gestalt
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:32px;">
                          <p style="margin:0 0 3px; font-family: Arial, sans-serif; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#9A8A7A;">Даты</p>
                          <p style="margin:0; font-family: Arial, sans-serif; font-size:14px; color:#3A3A3A;">2–3 октября 2026</p>
                        </td>
                        <td>
                          <p style="margin:0 0 3px; font-family: Arial, sans-serif; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#9A8A7A;">Место</p>
                          <p style="margin:0; font-family: Arial, sans-serif; font-size:14px; color:#3A3A3A;">Монтевидео, Уругвай</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; font-family: Arial, sans-serif; font-size: 15px; color: #3A3A3A; line-height: 1.7;">
                Если возникнут вопросы — мы всегда на связи.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:2px; background-color:#7A9E9B;">
                    <a href="mailto:gestalt.escuela.latinoamerica@gmail.com"
                       style="display:inline-block; padding:12px 28px; font-family:Arial, sans-serif; font-size:14px; color:#FFFFFF; text-decoration:none; letter-spacing:0.5px;">
                      Связаться с нами
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="padding: 32px 48px 48px;">
              <p style="margin:0; font-family: Arial, sans-serif; font-size:14px; color:#6B6B6B; line-height:1.6;">
                С тёплым приветствием,<br>
                <span style="font-family: Georgia, serif; font-style:italic; color:#9A8A7A;">Команда Escuela Latina de Terapia Gestalt</span>
              </p>
            </td>
          </tr>

          <tr>
            <td style="height:4px; background: linear-gradient(to right, #C4A47C, #7A9E9B); font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <tr>
            <td align="center" style="padding: 20px 48px 28px;">
              <p style="margin:0; font-family: Arial, sans-serif; font-size:12px; color:#B0A898; line-height:1.5;">
                Вы получили это письмо, потому что зарегистрировались на конференцию.<br>
                © 2026 Escuela Latina de Terapia Gestalt
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
      `,
    };
  }

  return {
    subject: "Escuela Latina de Terapia Gestalt — Confirmación de inscripción",
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Escuela Latina de Terapia Gestalt — Confirmación de inscripción</title>
</head>
<body style="margin:0; padding:0; background-color:#F2EDE8; font-family: Georgia, 'Times New Roman', serif;">

  <div style="display:none; max-height:0; overflow:hidden; color:#F2EDE8; font-size:1px;">
    Tu inscripción fue recibida — hasta pronto en Montevideo ✦
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F2EDE8; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px; width:100%; background-color:#FDFAF7; border-radius:4px; overflow:hidden;">

          <tr>
            <td style="height:4px; background: linear-gradient(to right, #C4A47C, #7A9E9B); font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <tr>
            <td style="padding: 48px 48px 16px;">

              <p style="margin: 0 0 24px; font-family: Georgia, serif; font-size: 22px; font-weight: normal; color: #1A1A1A; line-height: 1.4;">
                ¡Hola, <span style="color:#7A9E9B;">${escapeHtml(name)}</span>!
              </p>

              <p style="margin: 0 0 16px; font-family: Arial, sans-serif; font-size: 15px; color: #3A3A3A; line-height: 1.7;">
                Gracias por inscribirte en la conferencia.<br>
                Recibimos tu solicitud y pronto nos pondremos en contacto con vos con más detalles.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                     style="margin: 28px 0; background-color:#F7F3EF; border-left: 3px solid #C4A47C; border-radius: 2px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin:0 0 6px; font-family: Arial, sans-serif; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#9A8A7A;">Conferencia</p>
                    <p style="margin:0 0 16px; font-family: Georgia, serif; font-size: 17px; color:#1A1A1A; line-height:1.3;">
                      Escuela Latina de Terapia Gestalt
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:32px;">
                          <p style="margin:0 0 3px; font-family: Arial, sans-serif; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#9A8A7A;">Fechas</p>
                          <p style="margin:0; font-family: Arial, sans-serif; font-size:14px; color:#3A3A3A;">2 y 3 de octubre de 2026</p>
                        </td>
                        <td>
                          <p style="margin:0 0 3px; font-family: Arial, sans-serif; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#9A8A7A;">Lugar</p>
                          <p style="margin:0; font-family: Arial, sans-serif; font-size:14px; color:#3A3A3A;">Montevideo, Uruguay</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; font-family: Arial, sans-serif; font-size: 15px; color: #3A3A3A; line-height: 1.7;">
                Si tenés alguna pregunta, estamos a tu disposición.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:2px; background-color:#7A9E9B;">
                    <a href="mailto:gestalt.escuela.latinoamerica@gmail.com"
                       style="display:inline-block; padding:12px 28px; font-family:Arial, sans-serif; font-size:14px; color:#FFFFFF; text-decoration:none; letter-spacing:0.5px;">
                      Escribinos
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="padding: 32px 48px 48px;">
              <p style="margin:0; font-family: Arial, sans-serif; font-size:14px; color:#6B6B6B; line-height:1.6;">
                Con cariño,<br>
                <span style="font-family: Georgia, serif; font-style:italic; color:#9A8A7A;">El equipo de Escuela Latina de Terapia Gestalt</span>
              </p>
            </td>
          </tr>

          <tr>
            <td style="height:4px; background: linear-gradient(to right, #C4A47C, #7A9E9B); font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <tr>
            <td align="center" style="padding: 20px 48px 28px;">
              <p style="margin:0; font-family: Arial, sans-serif; font-size:12px; color:#B0A898; line-height:1.5;">
                Recibiste este correo porque te inscribiste en la conferencia.<br>
                © 2026 Escuela Latina de Terapia Gestalt
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `,
  };
}

function buildAdminEmail(reg: Registration) {
  const roles = formatRoles(reg.roles ?? [], "es");
  const source = reg.source ? (SOURCE_LABELS[reg.source] ?? reg.source) : "—";
  const paymentMethod = reg.payment_method
    ? (PAYMENT_METHOD_LABELS[reg.payment_method] ?? reg.payment_method)
    : "—";
  const speakerBlock =
    reg.talk_title || reg.talk_description
      ? `
        <h3 style="margin: 24px 0 8px;">Propuesta de charla / taller</h3>
        <ul style="padding-left: 18px;">
          ${reg.talk_title ? `<li><strong>Título:</strong> ${escapeHtml(reg.talk_title)}</li>` : ""}
          ${reg.talk_description ? `<li><strong>Descripción:</strong> ${escapeHtml(reg.talk_description)}</li>` : ""}
          ${reg.talk_duration ? `<li><strong>Duración:</strong> ${escapeHtml(reg.talk_duration)} min</li>` : ""}
          ${reg.talk_language ? `<li><strong>Idioma:</strong> ${escapeHtml(reg.talk_language)}</li>` : ""}
        </ul>
      `
      : "";

  return {
    subject: `Nueva inscripción: ${reg.name?.trim() || reg.email}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; color: #1A1A1A; line-height: 1.6; max-width: 640px;">
        <h2 style="margin: 0 0 16px;">Nueva inscripción en la conferencia</h2>
        <ul style="padding-left: 18px;">
          <li><strong>Nombre:</strong> ${escapeHtml(reg.name ?? "—")}</li>
          <li><strong>Email:</strong> ${escapeHtml(reg.email)}</li>
          <li><strong>Telegram / WhatsApp:</strong> ${escapeHtml(reg.messenger ?? "—")}</li>
          <li><strong>País:</strong> ${escapeHtml(reg.country ?? "—")}</li>
          <li><strong>Idioma preferido:</strong> ${escapeHtml(reg.language ?? "—")}</li>
          <li><strong>Forma de pago preferida:</strong> ${escapeHtml(paymentMethod)}</li>
          <li><strong>Forma de participación:</strong> ${escapeHtml(roles || "—")}</li>
          <li><strong>¿Cómo se enteró?:</strong> ${escapeHtml(source)}</li>
          ${reg.comment ? `<li><strong>Comentario:</strong> ${escapeHtml(reg.comment)}</li>` : ""}
        </ul>
        ${speakerBlock}
      </div>
    `,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseAdminEmails(value: string): string[] {
  return [...new Set(value.split(",").map((email) => email.trim()).filter(Boolean))];
}

async function sendEmail(
  apiKey: string,
  from: string,
  to: string | string[],
  subject: string,
  html: string,
) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend error (${response.status}): ${errorBody}`);
  }
}

async function verifyRecentRegistration(email: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return true;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("registrations")
    .select("email")
    .eq("email", email)
    .gte("created_at", since)
    .limit(1);

  if (error) {
    console.error("Registration lookup failed:", error.message);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmails = parseAdminEmails(
      Deno.env.get("ADMIN_EMAIL") ??
        "gestalt.escuela.latinoamerica@gmail.com,lubavusshka@gmail.com,darifadeevauy@gmail.com",
    );
    const fromEmail = Deno.env.get("FROM_EMAIL") ??
      "Escuela Latina <onboarding@resend.dev>";

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const registration = await req.json() as Registration;

    if (!registration?.email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isValid = await verifyRecentRegistration(registration.email);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Registration not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const participantEmail = buildParticipantEmail(registration);
    const adminEmailContent = buildAdminEmail(registration);

    await Promise.all([
      sendEmail(
        resendApiKey,
        fromEmail,
        registration.email,
        participantEmail.subject,
        participantEmail.html,
      ),
      sendEmail(
        resendApiKey,
        fromEmail,
        adminEmails,
        adminEmailContent.subject,
        adminEmailContent.html,
      ),
    ]);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(message);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
