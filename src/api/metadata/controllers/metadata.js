"use strict";

/**
 * metadata controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

/**
 * metadeta controller
 */

module.exports = createCoreController(
  "api::metadata.metadata",
  ({ strapi }) => ({
    async find(ctx) {
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized("You must be logged in to access this data.");
      }
      const data = await strapi.query("api::metadata.metadata").findMany({
        populate: ["users", "data"],
        where: { users: user.id },
      });

      return data;
    },
  })
);
