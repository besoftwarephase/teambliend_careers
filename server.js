/* ============================================================
 *  server.js  –  Bliend Careers Application Backend
 *  Stack : Express · Multer · Cloudinary · Resend
 * ============================================================ */

"use strict";

require("dotenv").config();

/* ─── Core Dependencies ───────────────────────────────────── */
const path    = require("path");
const express = require("express");
const cors    = require("cors");
const multer  = require("multer");

/* ─── Third-party Services ────────────────────────────────── */
const { Resend }    = require("resend");
const cloudinary    = require("cloudinary").v2;

/* ============================================================
 *  1. CONFIGURATION
 * ============================================================ */

/** Cloudinary – file storage */
cloudinary.config({
  cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
  api_key    : process.env.CLOUDINARY_API_KEY,
  api_secret : process.env.CLOUDINARY_API_SECRET,
});

/** Resend – transactional email */
const resend = new Resend(process.env.RESEND_API_KEY);

/** File upload constraints */
const FILE_CONFIG = {
  MAX_SIZE_BYTES : 5 * 1024 * 1024,          // 5 MB
  UPLOAD_TIMEOUT : 10_000,                    // 10 s  (Cloudinary)
  ALLOWED_MIMETYPES: new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
  MIMETYPE_TO_EXT: {
    "application/pdf"       : "pdf",
    "application/msword"    : "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  },
};

/** Email addresses */
const EMAIL_CONFIG = {
  FROM_ADDRESS : "Bliend Careers <careers@teambliend.com>",
  ADMIN_TO     : "nawinmoffl@gmail.com",
  ADMIN_CC     : ["ashabliend@gmail.com"],
};

/* ============================================================
 *  2. MULTER  –  Memory-based upload handler
 * ============================================================ */

const upload = multer({
  storage : multer.memoryStorage(),
  limits  : { fileSize: FILE_CONFIG.MAX_SIZE_BYTES },
  fileFilter(_req, file, cb) {
    if (FILE_CONFIG.ALLOWED_MIMETYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed."), false);
    }
  },
});

/* ============================================================
 *  3. CLOUDINARY HELPER  –  Upload resume buffer
 * ============================================================ */

/**
 * Uploads a file buffer to Cloudinary and returns the secure URL.
 *
 * @param {Buffer} buffer   – Raw file data
 * @param {string} ext      – File extension ("pdf" | "doc" | "docx")
 * @returns {Promise<string>} Secure Cloudinary URL
 */
function uploadToCloudinary(buffer, ext) {
  const isPdf = ext === "pdf";

  const uploadPromise = new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder        : "career/resumes",
        resource_type : "raw",
        format        : ext,
        public_id     : `resume_${Date.now()}`,
        flags         : isPdf ? "attachment:false" : "attachment",
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`Cloudinary upload timed out after ${FILE_CONFIG.UPLOAD_TIMEOUT / 1000}s`)),
      FILE_CONFIG.UPLOAD_TIMEOUT
    )
  );

  return Promise.race([uploadPromise, timeoutPromise]);
}

/* ============================================================
 *  4. EMAIL TEMPLATES
 * ============================================================ */

/**
 * Builds the internal admin notification email (HTML).
 *
 * @param {object} data – Parsed form fields from the candidate
 * @returns {string}
 */
function buildAdminEmailHTML(data) {
  const receivedAt = new Date().toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  /* Reusable row builder */
  const row = (label, value, shaded = false) => `
    <tr style="${shaded ? "background:#f9fafb;" : ""}">
      <td style="padding:10px 14px;font-weight:300;color:#374151;width:45%">${label}</td>
      <td style="padding:10px 14px;color:#111827">${value ?? "—"}</td>
    </tr>`;

  /* Section heading builder */
  const section = (title) => `
    <h3 style="margin:0 0 12px;font-size:14px;color:#4F46E5;text-transform:uppercase;
               letter-spacing:0.05em;border-bottom:2px solid #e5e7eb;padding-bottom:6px">
      ${title}
    </h3>`;

  return `
    <div style="font-family:sans-serif;max-width:640px;margin:auto;
                border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">

      <!-- Header -->
      <div style="background:#4F46E5;padding:24px 32px">
        <h2 style="color:#fff;margin:0;font-size:20px">Candidate Job Application</h2>
        <p style="color:#c7d2fe;margin:6px 0 0;font-size:13px">Received On: ${receivedAt}</p>
      </div>

      <!-- Body -->
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
          ${row("1. What are your hobbies or personal interests outside of work?",                       data.q_1, true)}
          ${row("2. Describe the most unconventional idea you ever had and what made it different?",     data.q_2)}
          ${row("3. In a marketing campaign, what matters most — emotion, logic, or attention? Why?",   data.q_3, true)}
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

      </div>

      <!-- Footer -->
      <div style="background:#f3f4f6;padding:14px 32px;font-size:12px;
                  color:#9ca3af;text-align:center">
        This is an automated email from Bliend Careers System
      </div>

    </div>`;
}

/**
 * Builds the candidate auto-reply confirmation email (HTML).
 *
 * @param {object} data – Parsed form fields from the candidate
 * @returns {string}
 */
function buildCandidateEmailHTML(data) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;
                border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">

      <!-- Header -->
      <div style="background:#4F46E5;padding:24px 32px">
        <h2 style="color:#fff;margin:0;font-size:20px">Application Received!</h2>
      </div>

      <!-- Body -->
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

      <!-- Footer -->
      <div style="background:#f3f4f6;padding:14px 32px;font-size:12px;
                  color:#9ca3af;text-align:center">
        © ${new Date().getFullYear()} Bliend. All rights reserved.
      </div>

    </div>`;
}

/* ============================================================
 *  5. EMAIL SERVICE  –  Send admin + candidate emails
 * ============================================================ */

/**
 * Dispatches both the admin notification and candidate confirmation
 * emails concurrently. Intentionally fire-and-forget (called after
 * the HTTP response has already been sent).
 *
 * @param {object} data       – Parsed form fields
 * @param {Buffer} fileBuffer – Raw resume file bytes
 * @param {string} ext        – File extension
 */
async function sendApplicationEmails(data, fileBuffer, ext) {
  console.log(`📧  Sending emails for: ${data.name} <${data.email}>`);

  try {
    const [adminResult, userResult] = await Promise.all([

      /* ── Admin notification (with CC + resume attachment) ── */
      resend.emails.send({
        from        : EMAIL_CONFIG.FROM_ADDRESS,
        to          : EMAIL_CONFIG.ADMIN_TO,
        cc          : EMAIL_CONFIG.ADMIN_CC,
        subject     : `New Candidate – ${data.name} | ${data.preferred_role}`,
        html        : buildAdminEmailHTML(data),
        attachments : [{
          filename : `${data.name}_Resume.${ext}`,
          content  : fileBuffer.toString("base64"),
          encoding : "base64",
        }],
      }),

      /* ── Candidate auto-reply ── */
      resend.emails.send({
        from    : EMAIL_CONFIG.FROM_ADDRESS,
        to      : data.email,
        subject : "Your application has been received – Bliend",
        html    : buildCandidateEmailHTML(data),
      }),

    ]);

    if (adminResult.data?.id) console.log("✅  Admin email sent  – ID:", adminResult.data.id);
    if (userResult.data?.id)  console.log("✅  Candidate email sent – ID:", userResult.data.id);

    if (adminResult.error) console.error("❌  Admin email error:", adminResult.error);
    if (userResult.error)  console.error("❌  Candidate email error:", userResult.error);

  } catch (err) {
    console.error("❌  EMAIL SEND FAILED");
    console.error("    Message :", err.message);
    console.error("    Verify RESEND_API_KEY in your environment variables.");
  }
}

/* ============================================================
 *  6. VALIDATION HELPERS
 * ============================================================ */

const REQUIRED_FIELDS = ["name", "email", "phone", "preferred_role"];

/**
 * Returns the name of the first missing required field, or null if all present.
 *
 * @param {object} body – req.body
 * @returns {string|null}
 */
function findMissingField(body) {
  return REQUIRED_FIELDS.find(
    (field) => !body[field] || !body[field].toString().trim()
  ) ?? null;
}

/* ============================================================
 *  7. EXPRESS APP  –  Middleware & Routes
 * ============================================================ */

const app = express();

/* ── Middleware ────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* ── GET /  ─  Serve careers page ─────────────────────────── */
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "career.html"));
});

/* ── GET /health  ─  Uptime probe ─────────────────────────── */
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

/* ── POST /submit  ─  Handle job application ──────────────── */
app.post("/submit", upload.single("resume"), async (req, res) => {
  try {
    console.log("📥  New submission from:", req.body?.name);
    console.log("    File:", req.file?.originalname, `(${req.file?.size} bytes)`);

    /* Validate file presence */
    if (!req.file) {
      return res.status(400).json({ status: "FAILED", error: "Resume file is required." });
    }

    /* Validate required text fields */
    const missingField = findMissingField(req.body);
    if (missingField) {
      return res.status(400).json({
        status : "FAILED",
        error  : `Missing required field: ${missingField}`,
      });
    }

    const ext = FILE_CONFIG.MIMETYPE_TO_EXT[req.file.mimetype];

    /* Upload resume to Cloudinary */
    let resumeURL;
    try {
      resumeURL = await uploadToCloudinary(req.file.buffer, ext);
      console.log("✅  Cloudinary upload done:", resumeURL);
    } catch (cloudErr) {
      console.error("❌  Cloudinary failed:", cloudErr.message);
      return res.status(500).json({
        status : "FAILED",
        error  : "File upload failed. Please try again.",
      });
    }

    /* Respond to client immediately – don't block on email delivery */
    res.status(200).json({
      status     : "SUCCESS",
      message    : "Application submitted successfully! You'll receive a confirmation email shortly.",
      resume_url : resumeURL,
    });

    /* Fire emails in the background after response is sent */
    sendApplicationEmails(req.body, req.file.buffer, ext);

  } catch (err) {
    console.error("❌  Unhandled error in POST /submit:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ status: "FAILED", error: "Something went wrong. Please try again." });
    }
  }
});

/* ============================================================
 *  8. ERROR HANDLERS
 * ============================================================ */

/** Multer-specific error handler (must be after routes) */
app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "File is too large. Maximum allowed size is 5 MB."
      : err.message;
    return res.status(400).json({ status: "FAILED", error: message });
  }

  if (err?.message) {
    return res.status(400).json({ status: "FAILED", error: err.message });
  }

  next(err);
});

/* ============================================================
 *  9. SERVER STARTUP
 * ============================================================ */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("─────────────────────────────────────────");
  console.log(`🚀  Server started on port ${PORT}`);
  console.log(`    Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`    Resend key  : ${process.env.RESEND_API_KEY        ? "✅ set" : "❌ NOT SET"}`);
  console.log(`    Cloudinary  : ${process.env.CLOUDINARY_CLOUD_NAME ? "✅ set" : "❌ NOT SET"}`);
  console.log("─────────────────────────────────────────");
});
