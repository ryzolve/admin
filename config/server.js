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
      // Daily certificate expiry check at 9:15 AM CST (15:15 UTC)
      "15 15 * * *": async ({ strapi }) => {
        console.log("Starting daily user certificate expiry check...");
        await strapi
          .service("api::user-certificate.user-certificate")
          .checkExpiringCertificates();
      },

      // TEST: Send expired certificate email to pas@ryzolve.com at 22:17 UTC - DELETE AFTER TESTING
      "17 22 * * *": async ({ strapi }) => {
        console.log("TEST: Sending expired certificate email to pas@ryzolve.com...");

        // Get any user-certificate to use as template data
        const userCert = await strapi.db
          .query("api::user-certificate.user-certificate")
          .findOne({
            populate: ["user", "course"],
          });

        if (!userCert) {
          console.log("No user-certificate found for test");
          return;
        }

        const RENEWAL_BASE_URL = process.env.CLIENT_URL || "https://training.ryzolve.com";
        const renewalUrl = `${RENEWAL_BASE_URL}/renewal?course=${userCert.course?.id}`;
        const courseName = userCert.course?.title || "your course";
        const userName = userCert.user?.firstname || userCert.user?.username || "Student";
        const expiryDate = userCert.expiryDate;

        const wrapEmail = (content, ctaText, ctaColor) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://fhfqjcc.stripocdn.email/content/guids/CABINET_e4cafd70dfbf78cd99f9e36321d47993cd56fe9c5c3482d5a73b875e3956e04b/images/screenshot_20240417_at_164631removebgpreview.png" alt="Ryzolve" style="max-width: 150px;" />
            </div>
            ${content}
            <div style="text-align: center; margin: 30px 0;">
              <a href="${renewalUrl}" style="display: inline-block; padding: 15px 30px; background-color: ${ctaColor}; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">${ctaText}</a>
            </div>
            <p style="font-size: 14px; color: #555;">Questions? Contact us at <a href="mailto:pas@ryzolve.com" style="color: #FF774B;">pas@ryzolve.com</a>.</p>
            <p style="font-size: 14px; color: #555;">Best regards,<br />The Ryzolve Team</p>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="font-size: 12px; color: #999;">© 2024 Ryzolve Inc. All rights reserved.</p>
              <p style="font-size: 12px; color: #999;">9309 Highway 75 S Ste 102, New Waverly, TX 77358</p>
            </div>
          </div>
        `;

        const expiredEmailHtml = wrapEmail(`
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
        `, "Renew & download certificate", "#FF774B");

        try {
          await strapi.plugins["email"].services.email.send({
            to: "pas@ryzolve.com",
            subject: `Your certificate expired on ${expiryDate} — renew now`,
            html: expiredEmailHtml,
          });
          console.log("TEST: Expired certificate email sent to pas@ryzolve.com");
        } catch (error) {
          console.error("TEST: Failed to send email:", error);
        }
      },
    },
  },
});
