#!/usr/bin/env node

/**
 * Issue Certificate Script
 *
 * Looks up a user by email, finds their latest passing final quiz score,
 * and creates a user-certificate + sends congratulations email if one
 * doesn't already exist.
 *
 * Usage:
 *   STRAPI_TOKEN=your_token node scripts/issue-certificate.js user@example.com
 *
 * Environment variables:
 *   STRAPI_URL   - e.g. https://admin.ryzolve.com (default)
 *   STRAPI_TOKEN - Full Access API token (required)
 *   PASS_THRESHOLD - Minimum passing percentage (default: 90)
 */

const STRAPI_URL = process.env.STRAPI_URL || "https://admin.ryzolve.com";
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || "";
const PASS_THRESHOLD = Number(process.env.PASS_THRESHOLD) || 90;
const CLIENT_URL = process.env.CLIENT_URL || "https://training.ryzolve.com";

const email = process.argv[2];

if (!STRAPI_TOKEN) {
  console.error("ERROR: STRAPI_TOKEN is required.");
  console.error(
    "Usage: STRAPI_TOKEN=your_token node scripts/issue-certificate.js user@example.com"
  );
  process.exit(1);
}

if (!email) {
  console.error("ERROR: Email argument is required.");
  console.error(
    "Usage: STRAPI_TOKEN=your_token node scripts/issue-certificate.js user@example.com"
  );
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${STRAPI_TOKEN}`,
};

// ---------- Helpers ----------

async function apiGet(path) {
  const res = await fetch(`${STRAPI_URL}/api/${path}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET /api/${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function apiPost(path, data) {
  const res = await fetch(`${STRAPI_URL}/api/${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST /api/${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function apiPut(path, data) {
  const res = await fetch(`${STRAPI_URL}/api/${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PUT /api/${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

// ---------- Main ----------

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("Issue Certificate Script");
  console.log("=".repeat(60));
  console.log(`Email:          ${email}`);
  console.log(`Strapi URL:     ${STRAPI_URL}`);
  console.log(`Pass threshold: ${PASS_THRESHOLD}%\n`);

  // 1. Find user by email
  console.log(`Looking up user with email: ${email}`);
  const usersRes = await fetch(
    `${STRAPI_URL}/api/users?filters[email][$eqi]=${encodeURIComponent(email)}`,
    { headers }
  );
  if (!usersRes.ok) throw new Error(`Failed to fetch users: ${usersRes.status}`);
  const users = await usersRes.json();

  if (!users.length) {
    console.error(`\nNo user found with email: ${email}`);
    process.exit(1);
  }

  const user = users[0];
  console.log(`  Found user: ${user.username} (ID: ${user.id})`);

  // 2. Fetch their quiz scores (final only, sorted by newest first)
  console.log(`\nFetching final quiz scores for user...`);
  const scoresJson = await apiGet(
    `quiz-scores?filters[user][id][$eq]=${user.id}&filters[quizType][$eq]=final&populate=course&sort=createdAt:desc&pagination[pageSize]=100`
  );
  const scores = scoresJson.data || [];

  if (!scores.length) {
    console.error(`\nNo final quiz scores found for ${user.username}`);
    process.exit(1);
  }

  console.log(`  Found ${scores.length} final quiz score(s)\n`);

  // 3. Fetch existing certificates for this user
  console.log("Fetching existing certificates...");
  const certsJson = await apiGet(
    `user-certificates?filters[user][id][$eq]=${user.id}&populate=course,quizScore`
  );
  const existingCerts = certsJson.data || [];

  const certifiedCourseIds = new Set();
  for (const cert of existingCerts) {
    const courseId = cert.attributes?.course?.data?.id;
    const status = cert.attributes?.status;
    if (courseId && status !== "expired") {
      certifiedCourseIds.add(courseId);
    }
  }
  console.log(
    `  User has ${existingCerts.length} certificate(s), ${certifiedCourseIds.size} active/expiring_soon\n`
  );

  // 4. Process each quiz score — find courses needing certificates
  let issued = 0;
  const processedCourses = new Set();

  for (const score of scores) {
    const attrs = score.attributes;
    const courseData = attrs.course?.data;
    const courseId = courseData?.id;
    const courseTitle = courseData?.attributes?.title || attrs.courseTitle || "Unknown Course";

    // Skip if no course relation
    if (!courseId) {
      console.log(`  Score #${score.id}: No course relation, skipping`);
      continue;
    }

    // Skip if we already processed this course (we only want the latest per course)
    if (processedCourses.has(courseId)) continue;
    processedCourses.add(courseId);

    const scoreNum = parseInt(attrs.score, 10) || 0;
    const totalQuestions = attrs.totalQuestions || 10;
    const percentage = (scoreNum / totalQuestions) * 100;

    console.log(
      `  Score #${score.id}: "${courseTitle}" — ${scoreNum}/${totalQuestions} (${percentage.toFixed(0)}%)`
    );

    // Check if passing
    if (percentage < PASS_THRESHOLD) {
      console.log(`    Not passing (below ${PASS_THRESHOLD}%), skipping`);
      continue;
    }

    // Fix isPassing if it was incorrectly set to false
    if (!attrs.isPassing) {
      console.log(`    Fixing isPassing to true on quiz-score #${score.id}...`);
      await apiPut(`quiz-scores/${score.id}`, { isPassing: true });
    }

    // Check if certificate already exists
    if (certifiedCourseIds.has(courseId)) {
      console.log(`    Certificate already exists, skipping`);
      continue;
    }

    // 5. Create certificate
    const issuedDate = new Date(attrs.createdAt);
    const expiryDate = new Date(attrs.createdAt);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const now = new Date();
    let status = "active";
    if (expiryDate < now) {
      status = "expired";
    } else {
      const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 30) status = "expiring_soon";
    }

    const issuedDateStr = issuedDate.toISOString().split("T")[0];
    const expiryDateStr = expiryDate.toISOString().split("T")[0];

    console.log(`    Creating certificate (issued: ${issuedDateStr}, expires: ${expiryDateStr})...`);

    const certRes = await apiPost("user-certificates", {
      user: user.id,
      course: courseId,
      quizScore: score.id,
      issuedDate: issuedDateStr,
      expiryDate: expiryDateStr,
      status,
      notificationsSent: ["certificate-issued"],
      publishedAt: new Date().toISOString(),
    });
    const certId = certRes.data?.id;

    certifiedCourseIds.add(courseId);
    issued++;
    console.log(`    Certificate created!`);

    // 6. Send congratulations email
    const userName = user.firstname || user.username || "Student";

    console.log(`    Sending congratulations email to ${user.email}...`);

    try {
      await fetch(`${STRAPI_URL}/api/email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          to: user.email,
          subject: `Congratulations! You've Earned Your ${courseTitle} Certificate`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://fhfqjcc.stripocdn.email/content/guids/CABINET_e4cafd70dfbf78cd99f9e36321d47993cd56fe9c5c3482d5a73b875e3956e04b/images/screenshot_20240417_at_164631removebgpreview.png" alt="Ryzolve" style="max-width: 150px;" />
              </div>
              <h2 style="color: #4CAF50; text-align: center;">Congratulations!</h2>
              <p style="font-size: 14px; color: #555;">Hi ${userName},</p>
              <p style="font-size: 14px; color: #555;">
                You've successfully completed <strong>${courseTitle}</strong> with a score of <strong>${percentage.toFixed(0)}%</strong>!
              </p>
              <p style="font-size: 14px; color: #555;">
                Your certificate has been issued and is now available in your account.
              </p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Course</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${courseTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Score</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${scoreNum}/${totalQuestions} (${percentage.toFixed(0)}%)</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Issued Date</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${issuedDateStr}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Valid Until</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${expiryDateStr}</td>
                </tr>
              </table>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${CLIENT_URL}/account/certificates" style="display: inline-block; padding: 15px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">View Your Certificate</a>
              </div>
              <p style="font-size: 14px; color: #555;">If you have any questions, please contact our support team.</p>
              <p style="font-size: 14px; color: #555;">Best regards,<br />The Ryzolve Team</p>
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #999;">&copy; 2024 Ryzolve Inc. All rights reserved.</p>
                <p style="font-size: 12px; color: #999;">9309 Highway 75 S Ste 102, New Waverly, TX 77358</p>
              </div>
            </div>
          `,
        }),
      });
      console.log(`    Email sent!`);
    } catch (emailErr) {
      console.error(`    Failed to send email: ${emailErr.message}`);
    }

    // Send admin notification
    try {
      await fetch(`${STRAPI_URL}/api/email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          to: "pas@ryzolve.com",
          subject: `New Certificate Issued (Manual): ${user.username} - ${courseTitle}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://fhfqjcc.stripocdn.email/content/guids/CABINET_e4cafd70dfbf78cd99f9e36321d47993cd56fe9c5c3482d5a73b875e3956e04b/images/screenshot_20240417_at_164631removebgpreview.png" alt="Ryzolve" style="max-width: 150px;" />
              </div>
              <h2 style="color: #333;">New Certificate Issued (Manual Script)</h2>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>User</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${user.username}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Email</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${user.email}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Course</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${courseTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Score</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${scoreNum}/${totalQuestions} (${percentage.toFixed(0)}%)</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Issued Date</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${issuedDateStr}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Expiry Date</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${expiryDateStr}</td>
                </tr>
              </table>
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #999;">&copy; 2024 Ryzolve Inc. All rights reserved.</p>
              </div>
            </div>
          `,
        }),
      });
      console.log(`    Admin notification sent`);
    } catch (adminEmailErr) {
      console.error(`    Failed to send admin email: ${adminEmailErr.message}`);
    }
  }

  // 7. Summary
  console.log("\n" + "=".repeat(60));
  console.log("Done!");
  console.log("=".repeat(60));
  console.log(`  Certificates issued: ${issued}`);
  console.log(
    `  Courses checked:     ${processedCourses.size}`
  );
  if (issued === 0) {
    console.log(
      `\n  No new certificates needed — either all passing scores already have certificates, or no passing final quiz scores were found.`
    );
  }
  console.log("");
}

main().catch((err) => {
  console.error("\nScript failed:", err);
  process.exit(1);
});
