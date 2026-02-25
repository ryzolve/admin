"use strict";

module.exports = {
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("You must be logged in to access this data.");
    }
    const data = await strapi
      .query("api::course.course")
      .findMany({ populate: ["users", "lessons"], where: { users: user.id } });
    return data;

    // console.log(ctx.request);
    // console.log(ctx.state.user);

    // if (ctx.request) {
    //   // Check user query
    //   if (
    //     ctx.request.query?.user &&
    //     ctx.request.query?.user == ctx.state.user.id
    //   )
    //     return ctx.request;

    //   // Set user filter
    //   if (!ctx.request.query.user) {
    //     ctx.request.query.user = ctx.state.user.username;
    //     return true;
    //   }

    //   //   // GraphQL
    // } else if (ctx.info) {
    //   ctx.args.filters = ctx.args.filters || {};
    //   ctx.args.filters.user = { id: { eq: ctx.state.user.id } };
    //   return true;
    // }

    // Deny access
  },
};
