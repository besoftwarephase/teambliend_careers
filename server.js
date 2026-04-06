/* ============================================================
 *  server.js  –  Bliend Careers Application Backend
 *  Stack : Express · Multer · Google Drive · Resend · JSZip
 * ============================================================ */

"use strict";

require("dotenv").config();

const path     = require("path");
const express  = require("express");
const cors     = require("cors");
const multer   = require("multer");
const { Readable } = require("stream");

const { Resend }       = require("resend");
const { google }       = require("googleapis");
const JSZip            = require("jszip");

/* ============================================================
 *  1. CONFIGURATION
 * ============================================================ */

const resend = new Resend(process.env.RESEND_API_KEY);

const FILE_CONFIG = {
  MAX_SIZE_BYTES     : 30 * 1024 * 1024,   // 30 MB  — multer hard cap
  COMPRESS_THRESHOLD : 5  * 1024 * 1024,   // 5  MB  — compress above this
  /*
   * Resend total email limit ~40 MB.
   * Base64 inflates by ~33%, so 25 MB raw → ~33 MB encoded → safe margin.
   * Above 25 MB → send Google Drive link instead of attaching.
   */
  ATTACH_MAX_BYTES   : 25 * 1024 * 1024,   // 25 MB
  UPLOAD_TIMEOUT     : 60_000,             // 60s — Drive uploads can be slower
  ALLOWED_MIMETYPES  : new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
  MIMETYPE_TO_EXT: {
    "application/pdf"       : "pdf",
    "application/msword"    : "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  },
  MIME_FROM_EXT: {
    pdf  : "application/pdf",
    doc  : "application/msword",
    docx : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
};

const EMAIL_CONFIG = {
  FROM_ADDRESS : "Bliend Careers <careers@teambliend.com>",
  ADMIN_TO     : "nawinmoffl@gmail.com",
  ADMIN_CC     : ["ashabliend@gmail.com"],
};

/* ============================================================
 *  2. MULTER
 * ============================================================ */

const upload = multer({
  storage : multer.memoryStorage(),
  limits  : { fileSize: FILE_CONFIG.MAX_SIZE_BYTES },
  fileFilter(_req, file, cb) {
    FILE_CONFIG.ALLOWED_MIMETYPES.has(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only PDF, DOC, and DOCX files are allowed."), false);
  },
});

/* ============================================================
 *  3. FILE COMPRESSION  (unchanged)
 * ============================================================ */

async function compressDocxBuffer(buffer, ext) {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const compressed = await zip.generateAsync({
      type              : "nodebuffer",
      compression       : "DEFLATE",
      compressionOptions: { level: 9 },
    });
    const before = (buffer.length     / 1024 / 1024).toFixed(2);
    const after  = (compressed.length / 1024 / 1024).toFixed(2);
    console.log(`📦  DOCX compressed: ${before} MB → ${after} MB`);
    return compressed.length < buffer.length ? compressed : buffer;
  } catch (err) {
    console.warn(`⚠️  Cannot parse ${ext} as ZIP (legacy .doc?) — skipping:`, err.message);
    return buffer;
  }
}

async function compressFileBuffer(buffer, mimetype, ext) {
  const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);

  if (buffer.length <= FILE_CONFIG.COMPRESS_THRESHOLD) {
    console.log(`✅  File ${sizeMB} MB — no server compression needed`);
    return buffer;
  }

  const isDocx = mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === "docx";
  const isDoc  = mimetype === "application/msword" || ext === "doc";

  if (isDocx || isDoc) {
    console.log(`🔄  ${ext.toUpperCase()} is ${sizeMB} MB — compressing…`);
    return compressDocxBuffer(buffer, ext);
  }

  console.log(`ℹ️   PDF ${sizeMB} MB — forwarding as-is`);
  return buffer;
}

/* ============================================================
 *  4. GOOGLE DRIVE UPLOAD
 *     Replaces uploadToCloudinary completely
 * ============================================================ */

/**
 * Returns an authenticated Google Drive client using OAuth2
 * credentials tied to the personal Google account (besoftwarephase@gmail.com).
 * This uses the account's own Drive storage quota — no service account quota issues.
 */
function getDriveClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    "urn:ietf:wg:oauth:2.0:oob"
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  });
  return google.drive({ version: "v3", auth: oauth2Client });
}

/**
 * Uploads a buffer to Google Drive (Career_Resumes folder) and returns
 * a permanent shareable view link for use in the admin email.
 *
 * Flow:
 *   1. Upload file to the Career_Resumes folder
 *   2. Set permission to "anyone with link can view"
 *      → HR can open without logging in
 *   3. Return the webViewLink (never expires)
 *
 * @param {Buffer} buffer
 * @param {string} ext
 * @param {string} candidateName
 * @returns {Promise<{ fileId: string, driveUrl: string }>}
 */
async function uploadToGoogleDrive(buffer, ext, candidateName) {
  const drive    = getDriveClient();
  const fileName = `${candidateName.replace(/\s+/g, "_")}_Resume_${Date.now()}.${ext}`;

  const uploadPromise = drive.files.create({
    requestBody: {
      name    : fileName,
      parents : [process.env.GOOGLE_DRIVE_FOLDER_ID],
    },
    media: {
      mimeType : FILE_CONFIG.MIME_FROM_EXT[ext] || "application/octet-stream",
      body     : Readable.from(buffer),
    },
    fields: "id, webViewLink",
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`Google Drive upload timed out after ${FILE_CONFIG.UPLOAD_TIMEOUT / 1000}s`)),
      FILE_CONFIG.UPLOAD_TIMEOUT
    )
  );

  const response = await Promise.race([uploadPromise, timeoutPromise]);
  const fileId   = response.data.id;

  // Allow anyone with the link to view — no Google login needed for HR
  await drive.permissions.create({
    fileId,
    requestBody: {
      role : "reader",
      type : "anyone",
    },
  });

  console.log(`☁️   Google Drive upload done — file: ${fileName}`);
  console.log(`🔗  Drive link: ${response.data.webViewLink}`);

  return {
    fileId,
    driveUrl: response.data.webViewLink,
  };
}

/* ============================================================
 *  5. EMAIL TEMPLATES
 * ============================================================ */

function buildAdminEmailHTML(data, driveUrl, attachedDirectly) {
  const receivedAt = new Date().toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const row = (label, value, shaded = false) => `
    <tr style="${shaded ? "background:#f9fafb;" : ""}">
      <td style="padding:10px 14px;font-weight:300;color:#374151;width:45%">${label}</td>
      <td style="padding:10px 14px;color:#111827">${value ?? "—"}</td>
    </tr>`;

  const section = (title) => `
    <h3 style="margin:0 0 12px;font-size:14px;color:#4F46E5;text-transform:uppercase;
               letter-spacing:0.05em;border-bottom:2px solid #e5e7eb;padding-bottom:6px">
      ${title}
    </h3>`;

  /*
   * Resume block:
   *   Small file → attached to email + Drive link shown
   *   Large file → Google Drive button only (no expiry ever)
   */
  const resumeSection = attachedDirectly
    ? `<p style="font-size:13px;color:#374151;margin:0 0 12px">
         📎 Resume is attached to this email.
       </p>
       <p style="font-size:13px;color:#374151;margin:0 0 24px">
         📁 Also saved permanently to Google Drive:
         <a href="${driveUrl}" style="color:#4F46E5;text-decoration:none">View in Drive</a>
       </p>`
    : `<p style="font-size:13px;color:#374151;margin:0 0 8px">
         The resume was too large to attach directly.
         Use the button below to open it in Google Drive — the link never expires.
       </p>
       <a href="${driveUrl}"
          style="display:inline-block;padding:10px 20px;background:#4F46E5;color:#fff;
                 border-radius:6px;text-decoration:none;font-size:13px;margin-bottom:24px">
         ⬇ Open Resume in Google Drive
       </a>`;

  return `
    <div style="font-family:sans-serif;max-width:640px;margin:auto;
                border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">

      <div style="background:#4F46E5;padding:24px 32px">
        <h2 style="color:#fff;margin:0;font-size:20px">Candidate Job Application</h2>
        <p style="color:#c7d2fe;margin:6px 0 0;font-size:13px">Received On: ${receivedAt}</p>
      </div>

      <div style="padding:24px 32px;background:#fff">

        ${section("Personal Information")}
        <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:24px">
          ${row("Full Name",       data.name,     true)}
          ${row("Email",           data.email)}
          ${row("Phone",           data.phone,    true)}
          ${row("Age",             data.dob)}
          ${row("Gender",          data.gender,   true)}
          ${row("Location",        data.location, true)}
          ${row("About Candidate", data.describe)}
        </table>

        ${section("Creative &amp; Logical Thinking")}
        <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:24px">
          ${row("1. Hobbies / personal interests outside of work?",       data.q_1, true)}
          ${row("2. Most unconventional idea and what made it different?", data.q_2)}
          ${row("3. Emotion, logic, or attention in a campaign — why?",   data.q_3, true)}
        </table>

        ${section("Open Position &amp; Final Details")}
        <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:24px">
          ${row("Preferred Role",          data.preferred_role,  true)}
          ${row("Years of Experience",     data.experience)}
          ${row("Expected Salary",         data.expected_salary, true)}
          ${row("Joining Date",            data.joining_date)}
          ${row("Preferred Work Location", data.work_location,   true)}
          ${row("Additional Info",         data.message || "—")}
        </table>

        ${section("Resume")}
        ${resumeSection}

      </div>

      <div style="background:#f3f4f6;padding:14px 32px;font-size:12px;
                  color:#9ca3af;text-align:center">
        Automated email · Bliend Careers System
      </div>

    </div>`;
}

function buildCandidateEmailHTML(data) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;
                border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">

      <div style="background:#4F46E5;padding:24px 32px">
        <h2 style="color:#fff;margin:0;font-size:20px">Application Received!</h2>
      </div>

      <div style="padding:24px 32px;background:#fff">
        <p style="font-size:15px;color:#111827;margin-top:0">
          Hi <strong>${data.name}</strong>,
        </p>
        <p style="font-size:14px;color:#374151;line-height:1.8">
          Thank you for applying for the <strong>${data.preferred_role}</strong> position
          at <strong>Bliend</strong>. We have successfully received your application along
          with your resume.
        </p>
        <p style="font-size:14px;color:#374151;line-height:1.8">
          Our team will carefully review your profile and get back to you shortly.
          We appreciate your interest in joining the Bliend family!
        </p>
        <p style="font-size:13px;color:#9ca3af;margin-top:24px">
          Questions? Reach us at
          <a href="mailto:careers@teambliend.com" style="color:#4F46E5;text-decoration:none">
            careers@teambliend.com
          </a>
        </p>
      </div>

      <div style="background:#f3f4f6;padding:14px 32px;font-size:12px;
                  color:#9ca3af;text-align:center">
        © ${new Date().getFullYear()} Bliend. All rights reserved.
      </div>

    </div>`;
}

/* ============================================================
 *  6. EMAIL SERVICE
 * ============================================================ */

/**
 * Sends admin + candidate emails.
 *
 * Attachment decision (after compression):
 *   <= 25 MB  →  attach file directly + include Drive link in email
 *   >  25 MB  →  embed Google Drive link only (no attachment)
 */
async function sendApplicationEmails(data, compressedBuffer, ext, driveUrl) {
  console.log(`📧  Sending emails for: ${data.name} <${data.email}>`);

  const fileSizeMB       = (compressedBuffer.length / 1024 / 1024).toFixed(2);
  const attachedDirectly = compressedBuffer.length <= FILE_CONFIG.ATTACH_MAX_BYTES;

  console.log(
    attachedDirectly
      ? `📎  Attaching directly (${fileSizeMB} MB) + Drive link`
      : `🔗  Too large (${fileSizeMB} MB) — Drive link only`
  );

  const adminPayload = {
    from    : EMAIL_CONFIG.FROM_ADDRESS,
    to      : EMAIL_CONFIG.ADMIN_TO,
    cc      : EMAIL_CONFIG.ADMIN_CC,
    subject : `New Candidate – ${data.name} | ${data.preferred_role}`,
    html    : buildAdminEmailHTML(data, driveUrl, attachedDirectly),
  };

  if (attachedDirectly) {
    adminPayload.attachments = [{
      filename : `${data.name}_Resume.${ext}`,
      content  : compressedBuffer.toString("base64"),
      encoding : "base64",
    }];
  }

  try {
    const [adminResult, userResult] = await Promise.all([
      resend.emails.send(adminPayload),
      resend.emails.send({
        from    : EMAIL_CONFIG.FROM_ADDRESS,
        to      : data.email,
        subject : "Your application has been received – Bliend",
        html    : buildCandidateEmailHTML(data),
      }),
    ]);

    if (adminResult.data?.id) console.log("✅  Admin email sent     – ID:", adminResult.data.id);
    if (userResult.data?.id)  console.log("✅  Candidate email sent – ID:", userResult.data.id);
    if (adminResult.error)    console.error("❌  Admin email error:", adminResult.error);
    if (userResult.error)     console.error("❌  Candidate email error:", userResult.error);

  } catch (err) {
    console.error("❌  EMAIL SEND FAILED:", err.message);
  }
}

/* ============================================================
 *  7. VALIDATION
 * ============================================================ */

const REQUIRED_FIELDS = ["name", "email", "phone", "preferred_role"];

function findMissingField(body) {
  return REQUIRED_FIELDS.find(
    (f) => !body[f] || !body[f].toString().trim()
  ) ?? null;
}

/* ============================================================
 *  8. EXPRESS APP
 * ============================================================ */

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public", "career.html")));

app.get("/health", (_req, res) =>
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
);

/* ── POST /submit ─────────────────────────────────────────── */
app.post("/submit", upload.single("resume"), async (req, res) => {
  try {
    const fileSizeMB = req.file ? (req.file.size / 1024 / 1024).toFixed(2) : "—";
    console.log(`📥  Submission: ${req.body?.name} | ${req.file?.originalname} (${fileSizeMB} MB)`);

    if (!req.file) {
      return res.status(400).json({ status: "FAILED", error: "Resume file is required." });
    }

    const missingField = findMissingField(req.body);
    if (missingField) {
      return res.status(400).json({ status: "FAILED", error: `Missing required field: ${missingField}` });
    }

    /* Respond to client immediately */
    res.status(200).json({
      status  : "SUCCESS",
      message : "Application submitted successfully! You'll receive a confirmation email shortly.",
    });

    /* Send candidate confirmation email IMMEDIATELY — no file needed */
    resend.emails.send({
      from    : EMAIL_CONFIG.FROM_ADDRESS,
      to      : req.body.email,
      subject : "Your application has been received – Bliend",
      html    : buildCandidateEmailHTML(req.body),
    }).then(result => {
      if (result.data?.id) console.log("✅  Candidate email sent – ID:", result.data.id);
      if (result.error)    console.error("❌  Candidate email error:", result.error);
    }).catch(err => console.error("❌  Candidate email failed:", err.message));

    /* Background pipeline: compress → upload to Drive → admin email only */
    const ext       = FILE_CONFIG.MIMETYPE_TO_EXT[req.file.mimetype];
    const rawBuffer = req.file.buffer;
    const bodyData  = req.body;

    (async () => {
      try {
        /* Step 1: Compress if needed */
        const compressedBuffer = await compressFileBuffer(rawBuffer, req.file.mimetype, ext);
        console.log(`📊  Final buffer: ${(compressedBuffer.length / 1024 / 1024).toFixed(2)} MB`);

        /* Step 2: Upload to Google Drive + get permanent shareable link */
        const { driveUrl } = await uploadToGoogleDrive(compressedBuffer, ext, bodyData.name);
        console.log("✅  Google Drive upload done — link ready");

        /* Step 3: Admin email only — attach or link based on compressed size */
        const fileSizeMB       = (compressedBuffer.length / 1024 / 1024).toFixed(2);
        const attachedDirectly = compressedBuffer.length <= FILE_CONFIG.ATTACH_MAX_BYTES;

        console.log(
          attachedDirectly
            ? `📎  Attaching directly (${fileSizeMB} MB) + Drive link`
            : `🔗  Too large (${fileSizeMB} MB) — Drive link only`
        );

        const adminPayload = {
          from    : EMAIL_CONFIG.FROM_ADDRESS,
          to      : EMAIL_CONFIG.ADMIN_TO,
          cc      : EMAIL_CONFIG.ADMIN_CC,
          subject : `New Candidate – ${bodyData.name} | ${bodyData.preferred_role}`,
          html    : buildAdminEmailHTML(bodyData, driveUrl, attachedDirectly),
        };

        if (attachedDirectly) {
          adminPayload.attachments = [{
            filename : `${bodyData.name}_Resume.${ext}`,
            content  : compressedBuffer.toString("base64"),
            encoding : "base64",
          }];
        }

        const adminResult = await resend.emails.send(adminPayload);
        if (adminResult.data?.id) console.log("✅  Admin email sent – ID:", adminResult.data.id);
        if (adminResult.error)    console.error("❌  Admin email error:", adminResult.error);

      } catch (err) {
        console.error("❌  Background processing failed:", err.message);
      }
    })();

  } catch (err) {
    console.error("❌  Unhandled error in POST /submit:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ status: "FAILED", error: "Something went wrong. Please try again." });
    }
  }
});

/* ============================================================
 *  9. ERROR HANDLERS
 * ============================================================ */

app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "File is too large. Maximum allowed size is 30 MB."
      : err.message;
    return res.status(400).json({ status: "FAILED", error: message });
  }
  if (err?.message) return res.status(400).json({ status: "FAILED", error: err.message });
  next(err);
});

/* ============================================================
 *  10. SERVER STARTUP
 * ============================================================ */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("─────────────────────────────────────────");
  console.log(`🚀  Server started on port ${PORT}`);
  console.log(`    Environment  : ${process.env.NODE_ENV || "development"}`);
  console.log(`    Resend key   : ${process.env.RESEND_API_KEY             ? "✅ set" : "❌ NOT SET"}`);
  console.log(`    OAuth Client : ${process.env.GOOGLE_OAUTH_CLIENT_ID     ? "✅ set" : "❌ NOT SET"}`);
  console.log(`    OAuth Secret : ${process.env.GOOGLE_OAUTH_CLIENT_SECRET ? "✅ set" : "❌ NOT SET"}`);
  console.log(`    OAuth Token  : ${process.env.GOOGLE_OAUTH_REFRESH_TOKEN ? "✅ set" : "❌ NOT SET"}`);
  console.log(`    Drive Folder : ${process.env.GOOGLE_DRIVE_FOLDER_ID     ? "✅ set" : "❌ NOT SET"}`);
  console.log("─────────────────────────────────────────");
});
