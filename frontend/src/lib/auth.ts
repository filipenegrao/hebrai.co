import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { sendEmail } from "./email";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        console.error("[reset-password] malformed reset URL; email not sent");
        return;
      }
      let parsedBase: URL;
      try {
        parsedBase = new URL(base);
      } catch {
        console.error("[reset-password] malformed BETTER_AUTH_URL; email not sent");
        return;
      }
      if (parsedUrl.origin !== parsedBase.origin) {
        console.error("[reset-password] reset URL origin does not match BETTER_AUTH_URL; email not sent");
        return;
      }

      try {
        await sendEmail({
          to: user.email,
          subject: "Redefinir sua senha — hebrai.co",
          html: `
            <p>Olá,</p>
            <p>Recebemos um pedido para redefinir a senha da sua conta.</p>
            <p><a href="${url}">Clique aqui para redefinir sua senha</a></p>
            <p>Se não foi você, ignore este email.</p>
            <p>O link expira em 1 hora.</p>
          `,
        });
      } catch (err) {
        console.error(
          "[reset-password] email delivery failed:",
          err instanceof Error ? err.message : String(err)
        );
        // Do not re-throw — preserves anti-enumeration: the HTTP response is unchanged
      }
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
});
