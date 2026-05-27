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
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
});
