require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// File upload setup
const upload = multer({ dest: "uploads/" });

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

app.get("/submit", (req,res)=>{
    res.send("Submit endpoint works only with POST");
});


// Submit route
app.post("/submit", upload.single("resume"), async (req, res) => {
  try {
    const d = req.body;

    // =========================
    // 1️⃣ Send Email to Admin
    // =========================
    await transporter.sendMail({
      from: `"Bliend Career Form" <${process.env.EMAIL_USER}>`,
      to: "ashaganga28@gmail.com",
      cc: [
        "nawin@hellobliend.com",
        "ashabliend@gmail.com",
        "nawinmoffl@gmail.com"
      ],
      replyTo: d.email,
      subject: `New Candidate Application – ${d.name} | ${d.preferred_role}`,
      html: `
        <h2>New Candidate Application</h2>
        <hr/>
        <p><b>Name:</b> ${d.name}</p>
        <p><b>Email:</b> ${d.email}</p>
        <p><b>Phone:</b> ${d.phone}</p>
        <p><b>Location:</b> ${d.location}</p>
        <p><b>Describe:</b> ${d.describe}</p>
        <p><b>1.when your creative idea faces rejection whats your next move :</b> ${d.q_1}</p>
        <p><b>Describe the most unconventional idea you ever had and what made it different :</b> ${d.q_2}</p>
        <p><b>3.In marketing campaign, what matters most to you, emotion, logic, ot attention ? Why  :</b> ${d.q_3}</p>
        <p><b>4.you have limited resources and time to launch a brand campaign. how would you still make it unforgettable?</b> ${d.q_4}</p>
        <hr/>
        <p><b>Preferred Role:</b> ${d.preferred_role}</p>
        <p><b>Expected Salary:</b> ${d.expected_salary}</p>
        <p><b>Joining Date:</b> ${d.joining_date}</p>
        <p><b>Message:</b> ${d.message}</p>
      `,
      attachments: req.file
        ? [
            {
              filename: req.file.originalname,
              path: req.file.path
            }
          ]
        : []
    });

    // =========================
    // 2️⃣ Auto Reply to Candidate
    // =========================
    await transporter.sendMail({
      from: `"Bliend Careers" <${process.env.EMAIL_USER}>`,
      to: d.email,
      subject: `Application Received – ${d.preferred_role} | Bliend`,
      html: `
        <div style="font-family:inter,sans-serif;line-height:1.6;">
          <h2>Hi ${d.name},</h2>

          <p>Thank you for applying for the 
          <b>${d.preferred_role}</b> position at <b>Bliend</b>.</p>

          <p>We have successfully received your application.</p>

          <p>Our hiring team is reviewing your profile and 
          will contact you if shortlisted.</p>

          <br/>

          <p>Best Regards,</p>
          <p><b>Bliend Team</b><br/>
          Advertising & Marketing</p>

          <hr/>
          <small>This is an automated email. Please do not reply.</small>
        </div>
      `
    });

  

    console.log("Emails sent successfully");
    res.json({ status: "SUCCESS" });

  } catch (err) {
    console.error("Mail error:", err);
    res.status(500).json({ status: "FAILED", error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});