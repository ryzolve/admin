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
  ],
};
