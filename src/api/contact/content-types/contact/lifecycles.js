module.exports = {
  async afterCreate(event) {
    const { result } = event;

    // Notify TJ (admin)
    await strapi.plugins["email"].services.email.send({
      to: "pas@ryzolve.com",
      subject: `New Contact: ${result.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #FF774B;">New Contact Form Submission</h2>
          <p><strong>From:</strong> ${result.fullname}</p>
          <p><strong>Email:</strong> ${result.email}</p>
          <p><strong>Subject:</strong> ${result.subject}</p>
          <hr style="border: 1px solid #eee;">
          <p><strong>Message:</strong></p>
          <p style="background: #f9f9f9; padding: 15px; border-radius: 5px;">${result.message}</p>
          <hr style="border: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">© 2026 Ryzolve Inc.</p>
        </div>
      `,
    });

    // Auto-reply to user
    await strapi.plugins["email"].services.email.send({
      to: result.email,
      subject: "We received your message - Ryzolve",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #FF774B;">Thank You for Contacting Us</h2>
          <p>Hi ${result.fullname},</p>
          <p>We've received your message and will respond within 24-48 hours.</p>
          <p>Best regards,<br><strong>The Ryzolve Team</strong></p>
          <hr style="border: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">© 2026 Ryzolve Inc. | 9309 Highway 75 S Ste 102, New Waverly, TX 77358</p>
        </div>
      `,
    });
  },
};
