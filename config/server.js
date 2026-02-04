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
      // Daily certificate expiry check at 9:15 AM CST (15:15 UTC) - DISABLED FOR NOW
      // "15 15 * * *": async ({ strapi }) => {
      //   console.log("Starting daily user certificate expiry check...");
      //   await strapi
      //     .service("api::user-certificate.user-certificate")
      //     .checkExpiringCertificates();
      // },

      // TEST: Send test email at 21:53 UTC (one-time test) - DELETE AFTER TESTING
      "53 21 * * *": async ({ strapi }) => {
        console.log("Sending test email to pas@ryzolve.com...");
        try {
          await strapi.plugins["email"].services.email.send({
            to: "pas@ryzolve.com",
            subject: "Cron Test - Certificate Expiry System",
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Cron Job Test</h2>
                <p>This is a test email to verify the cron job is working correctly.</p>
                <p>Timestamp: ${new Date().toISOString()}</p>
                <p>The certificate expiry check system is ready to be enabled.</p>
              </div>
            `,
          });
          console.log("Test email sent successfully!");
        } catch (error) {
          console.error("Failed to send test email:", error);
        }
      },
    },
  },
});
