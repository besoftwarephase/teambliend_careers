/* ============================================================
   GLOBAL ELEMENT REFS
   ============================================================ */

const fullName        = document.getElementById("name");
const email           = document.getElementById("email");
const phone           = document.getElementById("phone");
const dob             = document.getElementById("dob");
const gender          = document.getElementById("gender");
const currentLocation = document.getElementById("location");
const describe        = document.getElementById("describe");

const q_1           = document.getElementById("Question_1");
const q_2           = document.getElementById("Question_2");
const q_3           = document.getElementById("Question_3");
const q_5           = document.getElementById("job_role");
const exp           = document.getElementById("exp");
const workLocation  = document.getElementById("work_location");
const q_6           = document.getElementById("salary");
const q_7           = document.getElementById("joining_date");
const q_8           = document.getElementById("resume_file");
const q_9           = document.getElementById("addition");

const page1 = document.getElementById("step1_content");
const page2 = document.getElementById("step2_content");
const page3 = document.getElementById("step3_content");


/* ============================================================
   LOADER / MODAL
   ============================================================ */

const loader   = document.getElementById("myModal");
const closeBtn = document.querySelector(".close");

function showLoader() {
    loader.style.display = "flex";
    document.body.classList.add("no-scroll");
}

function hideLoader() {
    loader.style.display = "none";
    document.body.classList.remove("no-scroll");
}

closeBtn.addEventListener("click", hideLoader);

window.addEventListener("click", function (e) {
    if (e.target === loader) hideLoader();
});


/* ============================================================
   STEP UI — circles & menu labels
   ============================================================ */

const TICK_SVG = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <polyline points="1.5,6 4.5,9.5 10.5,2.5"
    stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function setCircleState(index, state) {
    const desktopCircles = document.querySelectorAll(".menu_bar .step_circles");
    const mobileCircles  = [
        document.getElementById("m_step1_circle"),
        document.getElementById("m_step2_circle"),
        document.getElementById("m_step3_circle"),
    ];

    [desktopCircles[index], mobileCircles[index]].forEach(function (circle) {
        if (!circle) return;
        circle.classList.remove("active", "completed", "disabled");

        if (state === "completed") {
            circle.classList.add("completed");
            circle.innerHTML = TICK_SVG;
        } else if (state === "active") {
            circle.classList.add("active");
            circle.innerHTML = index + 1;
        } else {
            circle.classList.add("disabled");
            circle.innerHTML = index + 1;
        }
    });
}

function setMenuState(index, state) {
    const desktopMenus = document.querySelectorAll(".menu_bar .menu_list");
    const mobileLabels = [
        document.getElementById("m_step1_label"),
        document.getElementById("m_step2_label"),
        document.getElementById("m_step3_label"),
    ];

    if (desktopMenus[index]) {
        desktopMenus[index].classList.remove("active", "completed", "disabled");
        desktopMenus[index].classList.add(state);
    }

    if (mobileLabels[index]) {
        mobileLabels[index].classList.toggle("active", state === "active");
    }
}


/* ============================================================
   FIELD UX — highlight & focus behaviour
   ============================================================ */

document.querySelectorAll(".highlight_text").forEach(function (field) {

    field.addEventListener("focusin", function () {
        this.classList.add("active-field", "active-text");
        this.style.borderColor = "unset";

        const container = this.closest(".input_field");
        if (container) {
            const errorBox      = container.querySelector(".error");
            const errorText     = container.querySelector(".error_messages");
            const errorinline   = container.querySelector(".s3-err-job_role_wrapper");
            const errorexp      = container.querySelector(".s3-err-exp_wrapper");
            const errorsalary   = container.querySelector(".salary-err");
            const errorlocation = container.querySelector(".s3-err-work_location_wrapper");
            if (errorBox)    errorBox.style.display = "none";
            if (errorText)   errorText.innerText    = "";
            if (errorinline) errorinline.innerText  = "";
            if (errorexp)    errorexp.innerText     = "";
            if (errorsalary) errorsalary.innerText  = "";
            if (errorlocation) errorlocation.innerText = "";
        }
    });

    field.addEventListener("focusout", function () {
        this.classList.remove("active-field");
        this.classList.add("active-text");
    });

    ["input", "change"].forEach(function (evt) {
        field.addEventListener(evt, function () {
            if (this.value == null) return;
            console.log("Before")
            this.style.color = this.value.trim() !== "" ? "#f5f5f5" : "";
        });
    });

});


/* ============================================================
   HELPERS — error display
   ============================================================ */

function showFieldError(fieldsetId, errorId, message) {
    const fieldset = document.getElementById(fieldsetId);
    const errorMsg = document.getElementById(errorId);
    if (fieldset) fieldset.style.borderColor = "#ff4d4f";
    if (errorMsg) errorMsg.innerText = message;
    const errorBox = fieldset ? fieldset.closest(".input_field").querySelector(".error") : null;
    if (errorBox) errorBox.style.display = "block";
}

function clearFieldError(fieldsetId, errorId) {
    const fieldset = document.getElementById(fieldsetId);
    const errorMsg = document.getElementById(errorId);
    if (fieldset) fieldset.style.borderColor = "unset";
    if (errorMsg) errorMsg.innerText = "";
    const errorBox = fieldset ? fieldset.closest(".input_field").querySelector(".error") : null;
    if (errorBox) errorBox.style.display = "none";
}

function showOrCreateStep3Error(wrapperId, message) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    const key = "s3-err-" + wrapperId;
    let errEl  = wrapper.parentElement ? wrapper.parentElement.querySelector("." + key) : null;

    if (!errEl) {
        errEl = document.createElement("p");
        errEl.className = key;
        errEl.style.cssText = "color:#ff4d4f9e;font-size:11px;margin-top:4px;font-family:inter,sans-serif;";
        wrapper.insertAdjacentElement("afterend", errEl);
    }
    errEl.innerText = message;
}

function removeStep3Error(wrapperId) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper || !wrapper.parentElement) return;
    const errEl = wrapper.parentElement.querySelector(".s3-err-" + wrapperId);
    if (errEl) errEl.innerText = "";
}

function showOrCreateErrorAfterEl(anchorEl, className, message) {
    if (!anchorEl) return;
    let errEl = anchorEl.parentElement ? anchorEl.parentElement.querySelector("." + className) : null;

    if (!errEl) {
        errEl = document.createElement("p");
        errEl.className = className;
        errEl.style.cssText = "color:#ff4d4f9e;font-size:11px;margin-top:5px;font-family:inter,sans-serif;";
        anchorEl.insertAdjacentElement("afterend", errEl);
    }
    errEl.innerText = message;
}

function removeErrorAfterEl(anchorEl, className) {
    if (!anchorEl || !anchorEl.parentElement) return;
    const errEl = anchorEl.parentElement.querySelector("." + className);
    if (errEl) errEl.innerText = "";
}


/* ============================================================
   VALIDATORS
   ============================================================ */

function validateStep1() {
    let isValid = true;

    const nameRegex  = /^[A-Za-z\s]{3,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;

    // Name
    if (!fullName.value.trim()) {
        showFieldError("fieldset_name", "name_error", "Full name is required");
        isValid = false;
    } else if (!nameRegex.test(fullName.value.trim())) {
        showFieldError("fieldset_name", "name_error", "Minimum 3 characters, letters only");
        isValid = false;
    } else {
        clearFieldError("fieldset_name", "name_error");
    }

    // Age
    const age = Number(dob.value.trim());
    if (!dob.value.trim()) {
        showFieldError("fieldset_dob", "dob_error", "Age is required");
        isValid = false;
    } else if (isNaN(age)) {
        showFieldError("fieldset_dob", "dob_error", "Enter a valid age");
        isValid = false;
    } else if (age < 21 || age > 45) {
        showFieldError("fieldset_dob", "dob_error", age < 21 ? "Minimum age is 21" : "Maximum age is 45");
        isValid = false;
    } else {
        clearFieldError("fieldset_dob", "dob_error");
    }

    // Gender
    if (!gender || !gender.value.trim()) {
        showFieldError("fieldset_gender", "gender_error", "Please select a gender");
        isValid = false;
    } else {
        clearFieldError("fieldset_gender", "gender_error");
    }

    // Email
    if (!email.value.trim()) {
        showFieldError("fieldset_email", "email_error", "Email is required");
        isValid = false;
    } else if (!emailRegex.test(email.value.trim())) {
        showFieldError("fieldset_email", "email_error", "Enter a valid email");
        isValid = false;
    } else {
        clearFieldError("fieldset_email", "email_error");
    }

    // Phone
    if (!phone.value.trim()) {
        showFieldError("fieldset_number", "contact_error", "Contact number is required");
        isValid = false;
    } else if (!phoneRegex.test(phone.value.trim())) {
        showFieldError("fieldset_number", "contact_error", "Enter a valid 10–15 digit phone number");
        isValid = false;
    } else {
        clearFieldError("fieldset_number", "contact_error");
    }

    // Location
    if (!currentLocation.value.trim()) {
        showFieldError("fieldset_location", "location_error", "Location is required");
        isValid = false;
    } else {
        clearFieldError("fieldset_location", "location_error");
    }

    // Describe
    const describeField = document.getElementById("describe_field");
    if (!describe.value.trim()) {
        describeField.style.setProperty("border-color", "#ff4d4f", "important");
        isValid = false;
    } else {
        describeField.style.removeProperty("border-color");
    }

    if (isValid) {
        page1.style.display = "none";
        page2.style.display = "block";
        setCircleState(0, "completed");
        setMenuState(0, "completed");
        setCircleState(1, "active");
        setMenuState(1, "active");
    }
}

function validateStep2() {
    let isValid = true;

    [q_1, q_2, q_3].forEach(function (field) {
        if (!field) return;
        if (!field.value.trim()) {
            field.style.setProperty("border-color", "#ff4d4f", "important");
            isValid = false;
        } else {
            field.style.removeProperty("border-color");
        }
    });

    if (isValid) {
        page2.style.display = "none";
        page3.style.display = "block";
        setCircleState(1, "completed");
        setMenuState(1, "completed");
        setCircleState(2, "active");
        setMenuState(2, "active");
    }
}

function validateStep3() {
    let isValid = true;

    // Preferred role
    const roleWrapper = document.getElementById("job_role_wrapper");
    if (!q_5 || !q_5.value.trim()) {
        if (roleWrapper) roleWrapper.style.setProperty("border-color", "#ff4d4f", "important");
        showOrCreateStep3Error("job_role_wrapper", "Please select a preferred role");
        isValid = false;
    } else {
        if (roleWrapper) roleWrapper.style.removeProperty("border-color");
        removeStep3Error("job_role_wrapper");
    }

    // Experience
    const expWrapper = document.getElementById("exp_wrapper");
    if (!exp || !exp.value.trim()) {
        if (expWrapper) expWrapper.style.setProperty("border-color", "#ff4d4f", "important");
        showOrCreateStep3Error("exp_wrapper", "Please select your experience");
        isValid = false;
    } else {
        if (expWrapper) expWrapper.style.removeProperty("border-color");
        removeStep3Error("exp_wrapper");
    }

    // Salary
    const salaryWrapper = q_6 ? q_6.closest(".salary") : null;
    if (!q_6 || !q_6.value.trim()) {
        if (salaryWrapper) salaryWrapper.style.setProperty("border-color", "#ff4d4f", "important");
        showOrCreateErrorAfterEl(salaryWrapper, "salary-err", "Expected salary is required");
        isValid = false;
    } else if (isNaN(parseInt(q_6.value)) || parseInt(q_6.value) <= 0) {
        if (salaryWrapper) salaryWrapper.style.setProperty("border-color", "#ff4d4f", "important");
        showOrCreateErrorAfterEl(salaryWrapper, "salary-err", "Enter a valid salary amount");
        isValid = false;
    } else {
        if (salaryWrapper) salaryWrapper.style.removeProperty("border-color");
        removeErrorAfterEl(salaryWrapper, "salary-err");
    }

    // Joining date
    const joiningErrorBox = document.getElementById("joining_date_error_box");
    const joiningError    = document.getElementById("joining_date_error");
    if (!q_7 || !q_7.value.trim()) {
        q_7.style.setProperty("border-color", "#ff4d4f", "important");
        if (joiningErrorBox) joiningErrorBox.style.display = "block";
        if (joiningError)    joiningError.textContent = "Please select your available date";
        isValid = false;
    } else {
        q_7.style.removeProperty("border-color");
        if (joiningErrorBox) joiningErrorBox.style.display = "none";
        if (joiningError)    joiningError.textContent = "";
    }

    // Work location (dropdown)
    const workLocationInput   = document.getElementById("work_location");
    const workLocationWrapper = document.getElementById("work_location_wrapper");
    const selectedWorkLocation = workLocationInput ? workLocationInput.value.trim() : "";

    if (!selectedWorkLocation) {
        if (workLocationWrapper) workLocationWrapper.style.setProperty("border-color", "#ff4d4f", "important");
        showOrCreateStep3Error("work_location_wrapper", "Please select a preferred work location");
        isValid = false;
    } else {
        if (workLocationWrapper) workLocationWrapper.style.removeProperty("border-color");
        removeStep3Error("work_location_wrapper");
    }

    // Resume file
    const resumeErrorBox = document.getElementById("resume_error_box");
    const resumeError    = document.getElementById("resume_error");

    if (!q_8) {
        console.warn("Element #resume_file not found in the DOM");
        isValid = false;
    } else if (!q_8.files[0]) {
        q_8.style.setProperty("border-color", "#ff4d4f", "important");
        if (resumeErrorBox) resumeErrorBox.style.display = "block";
        if (resumeError)    resumeError.textContent = "Please upload your resume";
        isValid = false;
    } else {
        const file             = q_8.files[0];
        const allowedTypes     = ["application/pdf", "application/msword",
                                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        const allowedExts      = ["pdf", "doc", "docx"];
        const fileExt          = file.name.toLowerCase().split(".").pop();

        q_8.style.removeProperty("border-color");
        if (resumeErrorBox) resumeErrorBox.style.display = "none";

        if (!allowedTypes.includes(file.type) && !allowedExts.includes(fileExt)) {
            alert("Only PDF / DOC / DOCX files are allowed");
            q_8.value = "";
            isValid = false;
        } else if (file.size > 5 * 1024 * 1024) {
            alert("Max file size is 5 MB");
            q_8.value = "";
            isValid = false;
        }
    }

    // Additional info
    if (!q_9 || !q_9.value.trim()) {
        q_9.style.setProperty("border-color", "#ff4d4f", "important");
        isValid = false;
    } else {
        q_9.style.removeProperty("border-color");
    }

    if (!isValid) return;

    // All valid — submit
    setCircleState(2, "completed");
    setMenuState(2, "completed");
    showLoader();

    const fd = new FormData();
    fd.append("name",            fullName.value.trim());
    fd.append("email",           email.value.trim());
    fd.append("phone",           phone.value.trim());
    fd.append("dob",             dob.value.trim());
    fd.append("gender",          gender.value.trim());
    fd.append("location",        currentLocation.value.trim());
    fd.append("describe",        describe.value.trim());
    fd.append("q_1",             q_1.value.trim());
    fd.append("q_2",             q_2.value.trim());
    fd.append("q_3",             q_3.value.trim());
    fd.append("preferred_role",  q_5  ? q_5.value.trim()                                       : "");
    fd.append("experience",      exp  ? exp.value.trim()                                        : "");
    fd.append("expected_salary", q_6  ? "₹ " + parseInt(q_6.value).toLocaleString("en-IN")     : "");
    fd.append("joining_date",    q_7  ? q_7.value.trim()                                        : "");
    fd.append("work_location",   selectedWorkLocation);
    fd.append("resume",          q_8.files[0]);
    fd.append("message",         q_9  ? q_9.value.trim()                                        : "");

    fetch("/submit", { method: "POST", body: fd })
        .then(async function (res) {
            let data;
            try { data = await res.json(); }
            catch { throw new Error("Server not returning JSON"); }
            if (!res.ok) throw new Error(data.error || "Server error");
            return data;
        })
        .then(function () {
            hideLoader();
            alert("Application submitted successfully!");
            window.location.href = "/";
        })
        .catch(function (err) {
            hideLoader();
            console.error("ERROR:", err);
            alert(err.message);
        });
}


/* ============================================================
   DATEPICKER
   ============================================================ */

$(function () {
    $("#joining_date").datepicker({
        dateFormat: "dd/mm/yy",
        minDate: 0,
        beforeShow: function (input, inst) {
            /*
             * Use setTimeout(..., 1) — one tick delay — so the browser has
             * finished painting the picker div before we read its dimensions.
             * setTimeout(..., 0) can still return 0 for outerHeight() on the
             * first paint, which caused the picker to open above the field.
             */
            setTimeout(function () {
                var $input   = $(input);
                var offset   = $input.offset();        // position relative to document
                var iWidth   = $input.outerWidth();    // match picker width to input
                var iHeight  = $input.outerHeight();
                var dpHeight = inst.dpDiv.outerHeight();

                var vpWidth   = $(window).width();
                var vpHeight  = $(window).height();
                var scrollTop = $(window).scrollTop();

                /* Available space below and above the input */
                var spaceBelow = vpHeight + scrollTop - (offset.top + iHeight + 5);
                var spaceAbove = offset.top - scrollTop - 5;

                /*
                 * Default: open BELOW the input.
                 * Only open ABOVE when there is genuinely not enough room below
                 * AND there is enough room above — prevents the "always opens above"
                 * bug that occurred when dpHeight was mis-read as 0.
                 */
                var top = (spaceBelow < dpHeight && spaceAbove >= dpHeight)
                    ? offset.top - dpHeight - 5   // open upward
                    : offset.top + iHeight + 5;   // open downward (default)

                /* Clamp left so the picker never overflows the right/left edge */
                var left = Math.max(
                    8,
                    Math.min(offset.left, vpWidth - iWidth - 8)
                );

                inst.dpDiv.css({
                    position : "absolute",   // reinforce absolute so coordinates are reliable
                    top      : top,
                    left     : left,
                    width    : iWidth,       // picker same width as the input field
                    minWidth : iWidth,
                });
            }, 1);   // <-- 1ms, not 0ms
        },
    });
});


/* ============================================================
   NAVIGATION — previous buttons
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    var prevBtn2 = document.getElementById("prevBtn2");
    if (prevBtn2) {
        prevBtn2.addEventListener("click", function () {
            page2.style.display = "none";
            page1.style.display = "block";
            setCircleState(1, "disabled");
            setMenuState(1, "disabled");
            setCircleState(0, "active");
            setMenuState(0, "active");
        });
    }

    var prevBtn3 = document.getElementById("prevBtn3");
    if (prevBtn3) {
        prevBtn3.addEventListener("click", function () {
            page3.style.display = "none";
            page2.style.display = "block";
            setCircleState(2, "disabled");
            setMenuState(2, "disabled");
            setCircleState(1, "active");
            setMenuState(1, "active");
        });
    }

});


/* ============================================================
   PROFILE — restore email from localStorage
   ============================================================ */

(function restoreProfileEmail() {
    const storedEmail = localStorage.getItem("userEmail");
    if (!storedEmail) return;

    const profileEmail = document.getElementById("profile_email");
    const profileImg   = document.getElementById("profile_img");
    const mobileIcon   = document.getElementById("mobile_profile_icon");
    const firstLetter  = storedEmail.charAt(0).toUpperCase();

    if (profileEmail) profileEmail.textContent = storedEmail;
    if (profileImg)   profileImg.textContent   = firstLetter;
    if (mobileIcon)   mobileIcon.textContent   = firstLetter;
})();


