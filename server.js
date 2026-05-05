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
  MAX_SIZE_BYTES     : 50 * 1024 * 1024,   // 50 MB  — multer hard cap
  COMPRESS_THRESHOLD : 5  * 1024 * 1024,   // 5  MB  — compress above this
  UPLOAD_TIMEOUT     : 60_000,             // 60s
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
  FROM_ADDRESS : "Uway Careers <contact@uway.in>",
  ADMIN_TO     : ["contact@uway.in"],
  ADMIN_CC     : ["uwaycareers@gmail.com","nawinuway@gmail.com"],
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
 *  3. FILE COMPRESSION
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
    console.log(`DOCX compressed: ${before} MB → ${after} MB`);
    return compressed.length < buffer.length ? compressed : buffer;
  } catch (err) {
    console.warn(`Cannot parse ${ext} as ZIP (legacy .doc?) — skipping:`, err.message);
    return buffer;
  }
}

async function compressFileBuffer(buffer, mimetype, ext) {
  const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);

  if (buffer.length <= FILE_CONFIG.COMPRESS_THRESHOLD) {
    console.log(` File ${sizeMB} MB — no compression needed`);
    return buffer;
  }

  const isDocx = mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === "docx";
  const isDoc  = mimetype === "application/msword" || ext === "doc";

  if (isDocx || isDoc) {
    console.log(` ${ext.toUpperCase()} is ${sizeMB} MB — compressing…`);
    return compressDocxBuffer(buffer, ext);
  }

  // PDF — cannot be compressed server-side, forward as-is
  console.log(` PDF is ${sizeMB} MB — forwarding as-is (PDF compression not supported)`);
  return buffer;
}

/* ============================================================
 *  4. GOOGLE DRIVE CLIENT
 * ============================================================ */

function getDriveClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return google.drive({ version: "v3", auth });
}

async function uploadToGoogleDrive(buffer, ext, candidateName) {
  const drive    = getDriveClient();
  const fileName = `${candidateName.replace(/\s+/g, "_")}_Resume_${Date.now()}.${ext}`;

  let readableStream;
  try {
    readableStream = Readable.from(buffer);
  } catch (err) {
    throw new Error(`Failed to create readable stream from buffer: ${err.message}`);
  }

  const uploadPromise = drive.files.create({
    supportsAllDrives : true,
    requestBody: {
      name    : fileName,
      parents : [process.env.GOOGLE_DRIVE_FOLDER_ID],
    },
    media: {
      mimeType : FILE_CONFIG.MIME_FROM_EXT[ext] || "application/octet-stream",
      body     : readableStream,
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

  if (!fileId) {
    throw new Error("Drive upload succeeded but returned no file ID.");
  }

  // Allow anyone with the link to view (no Google login needed)
  await drive.permissions.create({
    fileId,
    supportsAllDrives : true,
    requestBody: {
      role : "reader",
      type : "anyone",
    },
  });

  console.log(`Google Drive upload done — file: ${fileName}`);
  console.log(`🔗  Drive link: ${response.data.webViewLink}`);

  return {
    fileId,
    driveUrl: response.data.webViewLink,
  };
}

/* ============================================================
 *  5. EMAIL TEMPLATES
 * ============================================================ */

function buildAdminEmailHTML(data, driveUrl) {
  const receivedAt = new Date().toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const row = (label, value, shaded = false) => `
    <tr style="${shaded ? "background:#f0f4ff;" : ""}">
      <td style="padding:10px 14px;font-weight:600;color:#374151;width:45%">${label}</td>
      <td style="padding:10px 14px;color:#111827">${value ?? "—"}</td>
    </tr>`;

  const section = (title) => `
    <h3 style="margin:0 0 12px;font-size:14px;color:#3A75C4;text-transform:uppercase;
               letter-spacing:0.05em;border-bottom:2px solid #e5e7eb;padding-bottom:6px">
      ${title}
    </h3>`;

  const resumeSection = `
    <p style="font-size:13px;color:#374151;margin:0 0 8px">
      Click the button below to open the candidate's resume in Google Drive.
    </p>
    <a href="${driveUrl}"
       style="display:inline-block;padding:10px 20px;background:#3A75C4;color:#fff;
              border-radius:6px;text-decoration:none;font-size:13px;margin-bottom:24px">
       Open Resume in Google Drive
    </a>`;

  return `
    <div style="font-family:sans-serif;max-width:640px;margin:auto;
                border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
      <div style="background:#3A75C4;padding:24px 32px">
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
          ${row("Location",        data.location)}
          ${row("About Candidate", data.describe, true)}
        </table>
        ${section("Thinking &amp; Observation")}
        <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:24px">
          ${row("1. What are you becoming through the activities you engage in regularly?",                                                                                    data.q_1, true)}
          ${row("2. Something most people don't notice about a system/environment you interact with — but you have?", data.q_2)}
          ${row("3. What did you observe, why did it stand out, and how did you interpret it?",                        data.q_3, true)}
        </table>
        ${section("Open Position &amp; Final Details")}
        <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:24px">
          ${row("Preferred Role",          data.job_role,                   true)}
          ${row("Years of Experience",     data.experience)}
          ${row("Expected Salary (₹/mo)",  data.salary,                     true)}
          ${row("Joining Date",            data.joining_date)}
          ${row("Preferred Work Location", data.Preferred_work_location,    true)}
          ${row("Why join Uway?",          data.message || "—")}
        </table>
        ${section("Resume")}
        ${resumeSection}
      </div>
      <div style="background:#f3f4f6;padding:14px 32px;font-size:12px;
                  color:#9ca3af;text-align:center">
        Automated email · Uway Careers System
      </div>
    </div>`;
}

function buildCandidateEmailHTML(data) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;
                border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
      <div style="background: #3A75C4;padding:24px 32px">
        <h2 style="color:#fff;margin:0;font-size:20px">Application Received!</h2>
      </div>
      <div style="padding:24px 32px;background:#fff">
        <p style="font-size:15px;color:#111827;margin-top:0">
          Hi <strong>${data.name}</strong>,
        </p>
        <p style="font-size:14px;color:#374151;line-height:1.8">
          Thank you for applying for the <strong>${data.job_role}</strong> position
          at <strong>Uway</strong>. We have successfully received your application along
          with your resume.
        </p>
        <p style="font-size:14px;color:#374151;line-height:1.8">
          Our team will carefully review your profile and get back to you shortly.
          We appreciate your interest in joining the Uway Team!
        </p>
        <p style="font-size:13px;color:#9ca3af;margin-top:24px">
          Questions? Reach us at
          <a href="mailto:contact@uway.in" style="color:#4F46E5;text-decoration:none">
            contact@uway.in
          </a>
        </p>
      </div>
      <div style="background:#f3f4f6;padding:14px 32px;font-size:12px;
                  color:#9ca3af;text-align:center">
        © ${new Date().getFullYear()} Uway Groups. All rights reserved.
      </div>
    </div>`;
}

/* ============================================================
 *  6. EMAIL SERVICE
 * ============================================================ */

async function sendAdminEmail(data, driveUrl) {
  console.log(`🔗  Drive link only — no attachment`);

  const result = await resend.emails.send({
    from    : EMAIL_CONFIG.FROM_ADDRESS,
    to      : EMAIL_CONFIG.ADMIN_TO,
    cc      : EMAIL_CONFIG.ADMIN_CC,
    subject : `New Candidate – ${data.name} | ${data.job_role}`,
    html    : buildAdminEmailHTML(data, driveUrl),
  });

  if (result.data?.id) console.log("Admin email sent – ID:", result.data.id);
  if (result.error)    console.error("  Admin email error:", result.error);
}

/* ============================================================
 *  7. VALIDATION
 * ============================================================ */

const REQUIRED_FIELDS = ["name", "email", "phone", "job_role"];

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

/* ── GET /debug ── verify Drive access + Resend without a real submission ── */
app.get("/debug", async (_req, res) => {
  const results = { drive: null, resend: null };

  try {
    const drive   = getDriveClient();
    const listRes = await drive.files.list({
      q                        : `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`,
      pageSize                 : 3,
      fields                   : "files(id,name)",
      supportsAllDrives        : true,
      includeItemsFromAllDrives: true,
    });
    results.drive = { ok: true, filesFound: listRes.data.files.length, files: listRes.data.files };
  } catch (err) {
    results.drive = { ok: false, error: err.message };
  }

  try {
    const r = await resend.emails.send({
      from    : EMAIL_CONFIG.FROM_ADDRESS,
      to      : EMAIL_CONFIG.ADMIN_TO,
      subject : "Debug ping from Careers server",
      html    : `<p>Drive status: <strong>${results.drive.ok ? " OK" : " " + results.drive.error}</strong></p>
                 <p>Sent at: ${new Date().toISOString()}</p>`,
    });
    results.resend = r.error ? { ok: false, error: r.error } : { ok: true, id: r.data.id };
  } catch (err) {
    results.resend = { ok: false, error: err.message };
  }

  res.json(results);
});

/* ── POST /submit ─────────────────────────────────────────── */
app.post("/submit", upload.single("resume"), async (req, res) => {
  try {
    const fileSizeMB = req.file ? (req.file.size / 1024 / 1024).toFixed(2) : "—";
    console.log(` Submission: ${req.body?.name} | ${req.file?.originalname} (${fileSizeMB} MB)`);

    if (!req.file) {
      return res.status(400).json({ status: "FAILED", error: "Resume file is required." });
    }

    const missingField = findMissingField(req.body);
    if (missingField) {
      return res.status(400).json({ status: "FAILED", error: `Missing required field: ${missingField}` });
    }

    // Respond to client immediately — don't wait for Drive/email
    res.status(200).json({
      status  : "SUCCESS",
      message : "Application submitted successfully! You'll receive a confirmation email shortly.",
    });

    // Capture these before async pipeline (req may be GC'd)
    const ext       = FILE_CONFIG.MIMETYPE_TO_EXT[req.file.mimetype];
    const rawBuffer = req.file.buffer;
    const bodyData  = req.body;

    // Step A: Send candidate confirmation email immediately (no file needed)
    resend.emails.send({
      from    : EMAIL_CONFIG.FROM_ADDRESS,
      to      : bodyData.email,
      subject : "Your application has been received – Uway",
      html    : buildCandidateEmailHTML(bodyData),
    }).then(result => {
      if (result.data?.id) console.log(" Candidate email sent – ID:", result.data.id);
      if (result.error)    console.error(" Candidate email error:", result.error);
    }).catch(err => console.error(" Candidate email failed:", err.message));

    // Step B: Background pipeline — compress → Drive upload → admin email (Drive link only)
    (async () => {
      try {
        const compressedBuffer = await compressFileBuffer(rawBuffer, bodyData.mimetype || "", ext);
        console.log(` Final buffer: ${(compressedBuffer.length / 1024 / 1024).toFixed(2)} MB`);

        const { driveUrl } = await uploadToGoogleDrive(compressedBuffer, ext, bodyData.name);

        await sendAdminEmail(bodyData, driveUrl);

      } catch (bgErr) {
        console.error(" Background processing failed:", bgErr.message, bgErr.stack);

        // Fallback: alert admin even if Drive/email failed
        try {
          await resend.emails.send({
            from    : EMAIL_CONFIG.FROM_ADDRESS,
            to      : EMAIL_CONFIG.ADMIN_TO,
            subject : `[ERROR] Candidate submission – ${bodyData.name} | ${bodyData.job_role}`,
            html    : `
              <div style="font-family:sans-serif;max-width:640px;margin:auto;padding:24px;
                          border:2px solid #ef4444;border-radius:10px">
                <h2 style="color:#ef4444">Background Processing Failed</h2>
                <p>A candidate submitted their application but Drive upload or admin email failed.</p>
                <p><strong>Error:</strong> ${bgErr.message}</p>
                <hr/>
                <p><strong>Name:</strong>  ${bodyData.name}</p>
                <p><strong>Email:</strong> ${bodyData.email}</p>
                <p><strong>Phone:</strong> ${bodyData.phone}</p>
                <p><strong>Role:</strong>  ${bodyData.job_role}</p>
                <p style="color:#ef4444"><em>Resume NOT saved to Drive. Follow up manually.</em></p>
              </div>`,
          });
          console.log("Fallback error-alert sent to admin.");
        } catch (fallbackErr) {
          console.error("Fallback email also failed:", fallbackErr.message);
        }
      }
    })();

  } catch (err) {
    console.error("Unhandled error in POST /submit:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ status: "FAILED", error: "Something went wrong. Please try again." });
    }
  }
});

/* ============================================================
 *  9. ERROR HANDLERS
 * ============================================================ */

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "File is too large. Maximum allowed size is 30 MB."
      : err.message;
    return res.status(400).json({ status: "FAILED", error: message });
  }
  if (err?.message) return res.status(400).json({ status: "FAILED", error: err.message });
  res.status(500).json({ status: "FAILED", error: "Unknown server error." });
});

/* ============================================================
 *  10. SERVER STARTUP
 * ============================================================ */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("─────────────────────────────────────────");
  console.log(`    Server started on port ${PORT}`);
  console.log(`    Environment          : ${process.env.NODE_ENV || "development"}`);
  console.log(`    Resend key           : ${process.env.RESEND_API_KEY         ? " set" : " NOT SET"}`);
  console.log(`    Google Client Email  : ${process.env.GOOGLE_CLIENT_EMAIL    ? " set" : " NOT SET"}`);
  console.log(`    Google Private Key   : ${process.env.GOOGLE_PRIVATE_KEY     ? " set" : " NOT SET"}`);
  console.log(`    Drive Folder         : ${process.env.GOOGLE_DRIVE_FOLDER_ID ? " set" : " NOT SET"}`);
  console.log("─────────────────────────────────────────");
});
