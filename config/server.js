module.exports = ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  url: "https://admin.ryzolve.com/",
  app: {
    keys: env.array("APP_KEYS", ["key1", "key2"]),
  },
  cron: {
    enabled: true,
    tasks: {
      // TEST CRON - runs at 14:58 UTC for pas@ryzolve.com
      // REMOVE AFTER TESTING
      "58 14 * * *": async ({ strapi }) => {
        console.log("[TEST CRON] Sending test expired email to pas@ryzolve.com...");

        const user = await strapi.db.query("plugin::users-permissions.user").findOne({
          where: { email: "pas@ryzolve.com" },
        });

        if (!user) {
          console.log("[TEST CRON] User not found");
          return;
        }

        const cert = await strapi.db.query("api::user-certificate.user-certificate").findOne({
          where: { user: user.id, status: "expired" },
          populate: ["user", "course"],
        });

        if (!cert) {
          console.log("[TEST CRON] No expired certificate found");
          return;
        }

        const renewalUrl = `https://training.ryzolve.com/renewal?course=${cert.course?.id}`;
        const courseName = cert.course?.title || "your course";
        const userName = cert.user?.firstname || cert.user?.username || "Student";
        const expiryDate = cert.expiryDate;

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://fhfqjcc.stripocdn.email/content/guids/CABINET_e4cafd70dfbf78cd99f9e36321d47993cd56fe9c5c3482d5a73b875e3956e04b/images/screenshot_20240417_at_164631removebgpreview.png" alt="Ryzolve" style="max-width: 150px;" />
            </div>
            <p style="font-size: 14px; color: #555;">Hi ${userName},</p>
            <p style="font-size: 14px; color: #555;">Your <strong>${courseName}</strong> certificate expired on <strong>${expiryDate}</strong>.</p>
            <p style="font-size: 14px; color: #555;">Renew now to restore access and keep your training record current for compliance and audits. After completion, your updated certificate is available immediately in Ryzolve.</p>
            <p style="font-size: 14px; color: #555; font-weight: bold;">Why renew with Ryzolve</p>
            <ul style="font-size: 14px; color: #555; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Instant certificate download after completion</li>
              <li style="margin-bottom: 8px;">Training history stored in one place</li>
              <li style="margin-bottom: 8px;">Automated reminders so you don't lapse again</li>
              <li style="margin-bottom: 8px;">Support available if you need help</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${renewalUrl}" style="display: inline-block; padding: 15px 30px; background-color: #FF774B; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Renew & download certificate</a>
            </div>
            <p style="font-size: 14px; color: #555;">Questions? Contact us at <a href="mailto:pas@ryzolve.com" style="color: #FF774B;">pas@ryzolve.com</a>.</p>
            <p style="font-size: 14px; color: #555;">Best regards,<br />The Ryzolve Team</p>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="font-size: 12px; color: #999;">© 2024 Ryzolve Inc. All rights reserved.</p>
              <p style="font-size: 12px; color: #999;">9309 Highway 75 S Ste 102, New Waverly, TX 77358</p>
            </div>
          </div>
        `;

        try {
          await strapi.plugins["email"].services.email.send({
            to: "pas@ryzolve.com",
            subject: `Your certificate expired on ${expiryDate} — renew now`,
            html: html,
          });
          console.log("[TEST CRON] Email sent successfully!");
        } catch (error) {
          console.error("[TEST CRON] Failed:", error.message);
        }
      },
      // Run daily at 9:15 AM CST (15:15 UTC)
      "15 15 * * *": async ({ strapi }) => {
        console.log("Starting daily user certificate expiry check...");
        await strapi
          .service("api::user-certificate.user-certificate")
          .checkExpiringCertificates();
      },
    },
  },
});
