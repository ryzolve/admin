'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order', ({ strapi }) => ({
  async create(ctx) {
    const {
      products = [],
      username,
      email,
      discount = 0,
      user: requestUser,
    } = ctx.request.body || {};

    if (!Array.isArray(products) || products.length === 0) {
      ctx.response.status = 400;
      return { error: 'At least one product is required' };
    }

    try {
      const authenticatedUserId = ctx.state.user?.id;
      let buyerUser = requestUser || null;

      if (!buyerUser && authenticatedUserId) {
        buyerUser = await strapi.db
          .query('plugin::users-permissions.user')
          .findOne({ where: { id: authenticatedUserId } });
      }

      if (!buyerUser?.id) {
        ctx.response.status = 401;
        return { error: 'Authenticated user is required to create an order' };
      }

      const numericDiscount = Number(discount) || 0;
      const randomNumber = Math.floor(100000 + Math.random() * 900000);

      const lineItems = products.map((product) => {
        const basePrice = Number(product.price) || 0;
        const discountedPrice = Math.max(
          0,
          basePrice - (numericDiscount / 100) * basePrice
        );

        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.title,
            },
            unit_amount: Math.round(discountedPrice * 100),
          },
          quantity: 1,
        };
      });

      const metadata = {
        email: buyerUser.email || email || '',
        agency: buyerUser.agency || '',
        city: buyerUser.city || '',
        randomNumber: String(randomNumber),
      };

      const session = await stripe.checkout.sessions.create({
        customer_email: email || buyerUser.email,
        mode: 'payment',
        success_url:
          process.env.CLIENT_URL +
          `/purchase-completed?success='true'&username=${username || buyerUser.username || ''}`,
        cancel_url: process.env.CLIENT_URL + '/checkout',
        line_items: lineItems,
        metadata,
        payment_intent_data: {
          metadata,
        },
      });

      await strapi.service('api::order.order').create({
        data: {
          username: username || buyerUser.username || '',
          products,
          status: 'pending',
          stripeSessionToken: session.id,
          stripeRandomNumber: randomNumber,
          user: {
            connect: [buyerUser.id],
          },
        },
      });

      return { id: session.id };
    } catch (error) {
      strapi.log.error('[Order] Failed to create checkout session:', error);
      ctx.response.status = 500;
      return { error: 'Unable to create checkout session' };
    }
  },
}));
