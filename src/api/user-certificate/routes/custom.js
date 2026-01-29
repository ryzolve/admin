'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/user-certificates/test-expiry-email',
      handler: 'user-certificate.testExpiryEmail',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      // Manual trigger for certificate expiry check (use with external cron service)
      method: 'POST',
      path: '/user-certificates/check-expiring',
      handler: 'user-certificate.checkExpiring',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
