require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const { Resend } = require("resend");
const cloudinary = require("cloudinary").v2;

const app = express();

/* ================= CLOUDINARY CONFIG ================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log("Cloudinary Config Loaded");

/* ================= RESEND EMAIL SETUP ================= */
const resend = new Resend(process.env.RESEND_API_KEY);
console.log(`RESEND_API_KEY : ${process.env.RESEND_API_KEY ? "set" : "NOT SET — emails will fail"}`);

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* ================= HOME ROUTE ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "career.html"));
});

/* ================= HEALTH CHECK ================= */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

/* ================= FILE SETTINGS ================= */
const ALLOWED_MIMETYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MIMETYPE_TO_EXT = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

/* ================= MULTER ================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, DOCX files are allowed"), false);
    }
  },
});

/* ================= CLOUDINARY UPLOAD HELPER ================= */
function uploadToCloudinary(buffer, ext) {
  const isPdf = ext === "pdf";

  return Promise.race([
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "career/resumes",
          resource_type: "raw",
          format: ext,
          public_id: `resume_${Date.now()}`,
          flags: isPdf ? "attachment:false" : "attachment",
        },
        (err, result) => {
          if (err) return reject(err);
          resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Cloudinary upload timed out after 10s")), 10000)
    ),
  ]);
}

/* ================= EMAIL HELPER ================= */
async function sendEmailsInBackground(data, fileBuffer, ext, resumeURL) {

  /* ── CC LIST: Add / remove emails as needed ── */
  const CC_LIST = [
    "ashabliend@gmail.com",   // ✅ Add / remove CC emails here
  ];

  /* ── ADMIN EMAIL HTML ── */
  const adminHTML = `
    <div style="font-family:sans-serif;max-width:640px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">

      <!-- HEADER -->
      <div style="background:#4F46E5;padding:24px 32px">
        <h2 style="color:#fff;margin:0;font-size:20px">Candidate Job Application </h2>
        <p style="color:#c7d2fe;margin:6px 0 0;font-size:13px">
          Received on ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
        </p>
      </div>

      <div style="padding:24px 32px;background:#fff">

        <!-- SECTION 1: Personal Information -->
        <h3 style="margin:0 0 12px;font-size:14px;color:#4F46E5;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e5e7eb;padding-bottom:6px">
          Personal Information
        </h3>
        <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:24px">
          <tr style="background:#f9fafb">
            <td style="padding:10px 14px;font-weight:300;color:#374151;width:45%">Full Name</td>
            <td style="padding:10px 14px;color:#111827">${data.name}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:300;color:#374151">Email</td>
            <td style="padding:10px 14px;color:#111827">${data.email}</td>
          </tr>
          <tr style="background:#f9fafb">
            <td style="padding:10px 14px;font-weight:300;color:#374151">Phone</td>
            <td style="padding:10px 14px;color:#111827">${data.phone}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:300;color:#374151">Date of Birth</td>
            <td style="padding:10px 14px;color:#111827">${data.dob}</td>
          </tr>
          <tr style="background:#f9fafb">
            <td style="padding:10px 14px;font-weight:300;color:#374151">Location</td>
            <td style="padding:10px 14px;color:#111827">${data.location}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:300;color:#374151">About Candidate</td>
            <td style="padding:10px 14px;color:#111827">${data.describe}</td>
          </tr>
        </table>

        <!-- SECTION 2: Creative & Logical Thinking -->
        <h3 style="margin:0 0 12px;font-size:14px;color:#4F46E5;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e5e7eb;padding-bottom:6px">
          Creative & Logical Thinking
        </h3>
        <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:24px">
          <tr style="background:#f9fafb">
            <td style="padding:10px 14px;font-weight:300;color:#374151;width:45%">
              1. When your creative idea faces rejection, what's your next move?
            </td>
            <td style="padding:10px 14px;color:#111827">${data.q_1}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:300;color:#374151">
              2. Describe the most unconventional idea you ever had and what made it different?
            </td>
            <td style="padding:10px 14px;color:#111827">${data.q_2}</td>
          </tr>
          <tr style="background:#f9fafb">
            <td style="padding:10px 14px;font-weight:300;color:#374151">
              3. In a marketing campaign, what matters most — emotion, logic, or attention? Why?
            </td>
            <td style="padding:10px 14px;color:#111827">${data.q_3}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:300;color:#374151">
              4. You have limited resources and time to launch a brand campaign. How would you still make it unforgettable?
            </td>
            <td style="padding:10px 14px;color:#111827">${data.q_4}</td>
          </tr>
        </table>

        <!-- SECTION 3: Open Position & Final Details -->
        <h3 style="margin:0 0 12px;font-size:14px;color:#4F46E5;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e5e7eb;padding-bottom:6px">
          Open Position & Final Details
        </h3>
        <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:24px">
          <tr style="background:#f9fafb">
            <td style="padding:10px 14px;font-weight:300;color:#374151;width:45%">Preferred Role</td>
            <td style="padding:10px 14px;color:#111827">${data.preferred_role}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:300;color:#374151">Expected Salary</td>
            <td style="padding:10px 14px;color:#111827">${data.expected_salary}</td>
          </tr>
          <tr style="background:#f9fafb">
            <td style="padding:10px 14px;font-weight:300;color:#374151">Joining Date</td>
            <td style="padding:10px 14px;color:#111827">${data.joining_date}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:300;color:#374151">Additional Info</td>
            <td style="padding:10px 14px;color:#111827">${data.message || "—"}</td>
          </tr>
        </table>

      </div>

      <!-- FOOTER -->
      <div style="background:#f3f4f6;padding:14px 32px;font-size:12px;color:#9ca3af;text-align:center">
        This is an automated email from Bliend Careers System
      </div>

    </div>
  `;

  /* ── CANDIDATE AUTO-REPLY HTML ── */
  const userHTML = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">

      <!-- HEADER -->
      <div style="background:#4F46E5;padding:24px 32px">
        <h2 style="color:#fff;margin:0;font-size:20px"> Application Received!</h2>
      </div>

      <!-- BODY -->
      <div style="padding:24px 32px;background:#fff">
        <p style="font-size:15px;color:#111827;margin-top:0">Hi <strong>${data.name}</strong>,</p>
        <p style="font-size:14px;color:#374151;line-height:1.8">
          Thank you for applying for the <strong>${data.preferred_role}</strong> position at <strong>Bliend</strong>.
          We have successfully received your application along with your resume.
        </p>
        <p style="font-size:14px;color:#374151;line-height:1.8">
          Our team will carefully review your profile and get back to you shortly.
          We appreciate your interest in joining the Bliend family!
        </p>

        <p style="font-size:13px;color:#9ca3af;margin-top:24px">
          Questions? Reach us at
          <a href="mailto:careers@teambliend.com" style="color:#4F46E5;text-decoration:none">careers@teambliend.com</a>
        </p>
      </div>

      <!-- FOOTER -->
      <div style="background:#f3f4f6;padding:14px 32px;font-size:12px;color:#9ca3af;text-align:center">
        © ${new Date().getFullYear()} Bliend. All rights reserved.
      </div>

    </div>
  `;

  console.log(`Sending emails for: ${data.name} <${data.email}>`);

  try {
    const [adminResult, userResult] = await Promise.all([

      // Email 1: Admin notification with CC + resume attached
      resend.emails.send({
        from: "Bliend Careers <careers@teambliend.com>",
        to: "nawinmoffl@gmail.com",
        cc: CC_LIST,
        subject: `New Candidate – ${data.name} | ${data.preferred_role}`,
        html: adminHTML,
        attachments: [
          {
            filename: `${data.name}_Resume.${ext}`,
            content: fileBuffer.toString("base64"),  // ✅ base64 encoded
            encoding: "base64",
          },
        ],
      }),

      // Email 2: Auto-reply confirmation to candidate
      resend.emails.send({
        from: "Bliend Careers <careers@teambliend.com>",  // ✅ verified domain
        to: data.email,
        subject: "Your application has been received – Bliend",
        html: userHTML,
      }),

    ]);

    console.log("✅ Admin email sent! ID:", adminResult.data?.id);
    console.log("✅ User email sent!  ID:", userResult.data?.id);

    if (adminResult.error) console.error("❌ Admin email error:", adminResult.error);
    if (userResult.error)  console.error("❌ User email error:", userResult.error);

  } catch (err) {
    console.error("❌ EMAIL SEND FAILED");
    console.error("   Message:", err.message);
    console.error("   Check your RESEND_API_KEY in environment variables");
  }
}

/* ================= SUBMIT API ================= */
app.post("/submit", upload.single("resume"), async (req, res) => {
  try {
    console.log("New submission from:", req.body?.name);
    console.log("File:", req.file?.originalname, `(${req.file?.size} bytes)`);

    /* ── Validation ── */
    if (!req.file) {
      return res.status(400).json({
        status: "FAILED",
        error: "Resume file is required.",
      });
    }

    const requiredFields = ["name", "email", "phone", "preferred_role"];
    for (const field of requiredFields) {
      if (!req.body[field] || !req.body[field].toString().trim()) {
        return res.status(400).json({
          status: "FAILED",
          error: `Missing required field: ${field}`,
        });
      }
    }

    const d = req.body;
    const ext = MIMETYPE_TO_EXT[req.file.mimetype];

    /* ── Upload to Cloudinary ── */
    let resumeURL;
    try {
      resumeURL = await uploadToCloudinary(req.file.buffer, ext);
      console.log("✅ Cloudinary upload done:", resumeURL);
    } catch (cloudErr) {
      console.error("❌ Cloudinary failed:", cloudErr.message);
      return res.status(500).json({
        status: "FAILED",
        error: "File upload failed. Please try again.",
      });
    }

    /* ── Respond to client immediately ── */
    res.status(200).json({
      status: "SUCCESS",
      message: "Application submitted successfully! You'll receive a confirmation email shortly.",
      resume_url: resumeURL,
    });

    /* ── Emails fire in background after response is sent ── */
    sendEmailsInBackground(d, req.file.buffer, ext, resumeURL);

  } catch (err) {
    console.error("❌ Unhandled error in /submit:", err.message);
    if (!res.headersSent) {
      return res.status(500).json({
        status: "FAILED",
        error: "Something went wrong. Please try again.",
      });
    }
  }
});

/* ================= MULTER ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        status: "FAILED",
        error: "File is too large. Maximum size is 5MB.",
      });
    }
    return res.status(400).json({ status: "FAILED", error: err.message });
  }
  if (err && err.message) {
    return res.status(400).json({ status: "FAILED", error: err.message });
  }
  next(err);
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Environment   : ${process.env.NODE_ENV || "development"}`);
  console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? "✅ set" : "❌ NOT SET"}`);
  console.log(`CLOUDINARY    : ${process.env.CLOUDINARY_CLOUD_NAME || "❌ NOT SET"}`);
});