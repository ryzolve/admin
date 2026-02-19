'use strict';

const ADMIN_EMAIL = 'pas@ryzolve.com';

async function safeSend(emailService, payload, label) {
  try {
    await emailService.send(payload);
    strapi.log.info(`[SupportTicket] ${label} sent`);
    return true;
  } catch (error) {
    strapi.log.error(`[SupportTicket] Failed to send ${label}:`, error);
    return false;
  }
}

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    const emailService = strapi?.plugins?.email?.services?.email;

    if (!emailService) {
      strapi.log.error('[SupportTicket] Email plugin service is not available');
      return;
    }

    await safeSend(
      emailService,
      {
        to: ADMIN_EMAIL,
        subject: `[Help Desk] ${result.subject || 'New Support Ticket'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
            <h2 style="color: #FF774B; margin-bottom: 8px;">New Help Desk Ticket</h2>
            <p style="margin: 4px 0;"><strong>Name:</strong> ${result.fullname || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${result.email || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>Category:</strong> ${result.category || 'general'}</p>
            <p style="margin: 4px 0;"><strong>Source:</strong> ${result.source || 'training-module'}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> ${result.status || 'open'}</p>
            <hr style="border: 1px solid #eee; margin: 16px 0;" />
            <p style="margin: 0 0 8px;"><strong>Message:</strong></p>
            <div style="background: #f9f9f9; border-radius: 6px; padding: 12px; white-space: pre-wrap;">${
              result.message || ''
            }</div>
            <hr style="border: 1px solid #eee; margin: 16px 0;" />
            <p style="font-size: 12px; color: #666;">&copy; 2026 Ryzolve Inc.</p>
          </div>
        `,
      },
      'admin ticket notification'
    );

    if (result.email) {
      await safeSend(
        emailService,
        {
          to: result.email,
          subject: `Ticket Received: ${result.subject || 'Support Request'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <h2 style="color: #FF774B; margin-bottom: 8px;">We Received Your Support Request</h2>
              <p>Hi ${result.fullname || 'there'},</p>
              <p>Our team has received your ticket and will get back to you as soon as possible.</p>
              <p><strong>Category:</strong> ${result.category || 'general'}</p>
              <p><strong>Subject:</strong> ${result.subject || 'Support Request'}</p>
              <p>You can also use the live chat on the site for faster responses.</p>
              <p>Best regards,<br /><strong>Ryzolve Support</strong></p>
              <hr style="border: 1px solid #eee; margin: 16px 0;" />
              <p style="font-size: 12px; color: #666;">&copy; 2026 Ryzolve Inc. | 9309 Highway 75 S Ste 102, New Waverly, TX 77358</p>
            </div>
          `,
        },
        'user ticket acknowledgement'
      );
    }
  },
};
