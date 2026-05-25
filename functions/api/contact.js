export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const { name, email, subject, message } = data;

    // Validate inputs
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare email body
    const emailSubject = subject ? `[JDM Retro Rides] ${subject}` : `[JDM Retro Rides] New Enquiry from ${name}`;
    const emailText = `
New enquiry received from JDM Retro Rides website!

Sender Details:
---------------------------------------------
Name: ${name}
Email: ${email}
Subject: ${subject || "No Subject Specified"}

Message:
---------------------------------------------
${message}
    `;

    // 1. Check for SENDGRID_API_KEY
    if (env.SENDGRID_API_KEY && env.TO_EMAIL) {
      const fromEmail = env.FROM_EMAIL || "no-reply@danburgess.com";
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: env.TO_EMAIL }] }],
          from: { email: fromEmail, name: "JDM Retro Rides Contact Form" },
          reply_to: { email: email, name: name },
          subject: emailSubject,
          content: [{ type: "text/plain", value: emailText }]
        })
      });

      if (!response.ok) {
        const errDetails = await response.text();
        throw new Error(`SendGrid API error: ${errDetails}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Enquiry sent successfully via SendGrid." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Check for RESEND_API_KEY
    if (env.RESEND_API_KEY && env.TO_EMAIL) {
      const fromEmail = env.FROM_EMAIL || "onboarding@resend.dev";
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `JDM Retro Rides <${fromEmail}>`,
          to: env.TO_EMAIL,
          reply_to: email,
          subject: emailSubject,
          text: emailText
        })
      });

      if (!response.ok) {
        const errDetails = await response.text();
        throw new Error(`Resend API error: ${errDetails}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Enquiry sent successfully via Resend." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Fallback / warning if variables are not yet set
    return new Response(
      JSON.stringify({
        error: "Server configuration missing. Please define SENDGRID_API_KEY or RESEND_API_KEY alongside TO_EMAIL in Cloudflare Pages dashboard.",
        debug_received: { name, email, subject, message }
      }),
      { status: 501, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process the message." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
