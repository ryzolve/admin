'use strict';

const ADMIN_EMAIL = 'pas@ryzolve.com';

async function safeSend(emailService, payload, label) {
  try {
    await emailService.send(payload);
    strapi.log.info(`[Contact] ${label} email sent`);
    return true;
  } catch (error) {
    strapi.log.error(`[Contact] Failed sending ${label} email:`, error);
    return false;
  }
}

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    const emailService = strapi?.plugins?.email?.services?.email;

    if (!emailService) {
      strapi.log.error('[Contact] Email plugin service is not available');
      return;
    }

    await safeSend(
      emailService,
      {
        to: ADMIN_EMAIL,
        subject: `New Contact: ${result.subject || 'No Subject'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #FF774B;">New Contact Form Submission</h2>
            <p><strong>From:</strong> ${result.fullname || 'N/A'}</p>
            <p><strong>Email:</strong> ${result.email || 'N/A'}</p>
            <p><strong>Subject:</strong> ${result.subject || 'N/A'}</p>
            <hr style="border: 1px solid #eee;">
            <p><strong>Message:</strong></p>
            <p style="background: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${result.message || ''}</p>
            <hr style="border: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">&copy; 2026 Ryzolve Inc.</p>
          </div>
        `,
      },
      'admin notification'
    );

    if (result.email) {
      await safeSend(
        emailService,
        {
          to: result.email,
          subject: 'We received your message - Ryzolve',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <h2 style="color: #FF774B;">Thank You for Contacting Us</h2>
              <p>Hi ${result.fullname || 'there'},</p>
              <p>We've received your message and will respond within 24-48 hours.</p>
              <p>For immediate assistance, you can also use the live chat on our site.</p>
              <p>Best regards,<br><strong>The Ryzolve Team</strong></p>
              <hr style="border: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">&copy; 2026 Ryzolve Inc. | 9309 Highway 75 S Ste 102, New Waverly, TX 77358</p>
            </div>
          `,
        },
        'user acknowledgement'
      );
    }
  },
};
