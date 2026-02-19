'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::order.order', ({ strapi }) => ({
  async checkIncompleteCourses() {
    const now = new Date();
    const reminderDays = [30, 14, 7, 3];

    const orders = await strapi.entityService.findMany('api::order.order', {
      filters: { status: 'paid' },
      populate: ['user'],
    });

    for (const order of orders) {
      if (!order.user) continue;

      const products = Array.isArray(order.products) ? order.products : [];
      if (products.length === 0) continue;

      const courseIds = products
        .map((product) => String(product?.id || '').trim())
        .filter(Boolean);
      if (courseIds.length === 0) continue;

      const daysSincePurchase = Math.floor(
        (now - new Date(order.createdAt)) / (1000 * 60 * 60 * 24)
      );
      const remindersSent = Array.isArray(order.remindersSent) ? order.remindersSent : [];

      const dueReminderDay = reminderDays.find(
        (day) => daysSincePurchase >= day && !remindersSent.includes(day)
      );

      if (!dueReminderDay) continue;

      const hasAnyQuizProgress = await this.hasAnyQuizProgressForCourses(
        order.user.id,
        courseIds
      );

      // Requirement: remind only users who have not started any quiz.
      if (hasAnyQuizProgress) continue;

      await this.sendReminderEmail(order, dueReminderDay);

      await strapi.entityService.update('api::order.order', order.id, {
        data: { remindersSent: [...remindersSent, dueReminderDay] },
      });
    }

    strapi.log.info('[Reminder] Course completion reminder check completed');
  },

  async hasAnyQuizProgressForCourses(userId, courseIds) {
    const numericCourseIds = courseIds
      .map((courseId) => Number(courseId))
      .filter((courseId) => Number.isInteger(courseId));

    // Backward compatibility: historical quiz-score records (mainly final quiz attempts)
    const finalQuizAttempts =
      numericCourseIds.length > 0
        ? await strapi.entityService.findMany('api::quiz-score.quiz-score', {
            filters: {
              user: { id: userId },
              course: { id: { $in: numericCourseIds } },
            },
            populate: ['course'],
          })
        : [];

    if (finalQuizAttempts.length > 0) {
      return true;
    }

    // New journey tracking path: quiz attempts stored in metadata component entries.
    const metadataRows = await strapi.entityService.findMany('api::metadata.metadata', {
      filters: { users: { id: userId } },
      populate: { data: true },
    });

    for (const metadataRow of metadataRows) {
      const entries = Array.isArray(metadataRow?.data) ? metadataRow.data : [];
      const hasQuizEntry = entries.some((entry) => {
        const entryType = String(entry?.entryType || '');
        const entryCourseId = String(entry?.course_id || '');
        return (
          entryType.startsWith('quiz_') &&
          entryCourseId &&
          courseIds.includes(entryCourseId)
        );
      });

      if (hasQuizEntry) {
        return true;
      }
    }

    return false;
  },

  async sendReminderEmail(order, days) {
    const products = Array.isArray(order.products) ? order.products : [];
    const courseNames = products.map((p) => p.title || p.name || 'Course').join(', ');
    const userName = order.user.firstname || order.user.username || 'there';
    const urgencyText =
      days >= 14
        ? "Don't miss out on your certification!"
        : days >= 7
          ? 'Your certification is waiting for you!'
          : 'Start your training today!';

    try {
      await strapi.plugins['email'].services.email.send({
        to: order.user.email,
        subject: `Complete your training - ${courseNames}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF774B;">Complete Your Training</h2>
            <p>Hi ${userName},</p>
            <p>You enrolled in <strong>${courseNames}</strong> ${days} days ago but haven't completed any quiz yet.</p>
            <p>${urgencyText}</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="https://training.ryzolve.com/account/my-learning" 
                 style="background: #FF774B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Continue Learning
              </a>
            </p>
            <p>If you have any questions, reply to this email or use the chat on our website.</p>
            <p>Best regards,<br><strong>The Ryzolve Team</strong></p>
            <hr style="border: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">&copy; 2026 Ryzolve Inc. | 9309 Highway 75 S Ste 102, New Waverly, TX 77358</p>
          </div>
        `,
      });

      strapi.log.info(
        `[Reminder] Sent ${days}-day reminder to ${order.user.email} for order ${order.id}`
      );
    } catch (error) {
      strapi.log.error(`[Reminder] Failed to send email to ${order.user.email}:`, error);
    }
  },
}));
