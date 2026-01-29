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
      // Dry-run check every 5 minutes - logs counts without sending emails
      "*/5 * * * *": async ({ strapi }) => {
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

        // Calculate target dates
        const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const in1Day = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        // Count certificates for each category
        const count30Day = await strapi.db.query("api::user-certificate.user-certificate").count({
          where: { expiryDate: in30Days, status: { $ne: "expired" } },
        });

        const count7Day = await strapi.db.query("api::user-certificate.user-certificate").count({
          where: { expiryDate: in7Days, status: { $ne: "expired" } },
        });

        const count1Day = await strapi.db.query("api::user-certificate.user-certificate").count({
          where: { expiryDate: in1Day, status: { $ne: "expired" } },
        });

        const countExpired = await strapi.db.query("api::user-certificate.user-certificate").count({
          where: { expiryDate: { $lt: todayStr }, status: { $ne: "expired" } },
        });

        console.log(`[CRON DRY-RUN] ${today.toISOString()}`);
        console.log(`  Today: ${todayStr}`);
        console.log(`  30-day (${in30Days}): ${count30Day} certificates`);
        console.log(`  7-day (${in7Days}): ${count7Day} certificates`);
        console.log(`  1-day (${in1Day}): ${count1Day} certificates`);
        console.log(`  Expired (before ${todayStr}): ${countExpired} certificates`);
        console.log(`  TOTAL emails that would be sent: ${count30Day + count7Day + count1Day + countExpired}`);
      },
      // Run daily at 9:15 AM Central (14:15 UTC / 15:15 UTC depending on DST)
      "15 14 * * *": async ({ strapi }) => {
        console.log("Starting daily user certificate expiry check...");
        await strapi
          .service("api::user-certificate.user-certificate")
          .checkExpiringCertificates();
      },
    },
  },
});
