/*======== LOADER ============*/
const loader = document.getElementById("myModal");
const closeBtn = document.querySelector(".close");

/* SHOW LOADER */
function showLoader() {
    loader.style.display = "flex";
    document.body.classList.add("no-scroll");
}

/* HIDE LOADER */
function hideLoader() {
    loader.style.display = "none";
    document.body.classList.remove("no-scroll");
}

/* CLOSE BUTTON */
closeBtn.addEventListener("click", function () {
    hideLoader();
});

/* CLICK OUTSIDE MODAL TO CLOSE */
window.addEventListener("click", function (e) {
    if (e.target === loader) {
        hideLoader();
    }
});


/*======== HIGHLIGHT TEXTS ============*/
const fields = document.querySelectorAll(".highlight_text");

fields.forEach(function (field) {

    /* FOCUS IN — add active border, clear errors */
    field.addEventListener("focusin", function () {
        this.classList.add("active-field");
        this.classList.add("active-text");

        /* Remove red border */
        this.style.borderColor = "unset";

        /* Find parent input container */
        const container = this.closest(".input_field");
        if (container) {
            const errorBox = container.querySelector(".error");
            if (errorBox) errorBox.style.display = "none";

            const errorText = container.querySelector(".error_messages");
            if (errorText) errorText.innerText = "";
        }
    });

    /* FOCUS OUT */
    field.addEventListener("focusout", function () {
        this.classList.remove("active-field");
        this.classList.add("active-text");
    });

    /* FIX: Highlight background when field has a value (input = live typing) */
    field.addEventListener("input", function () {
        if (this.value === undefined || this.value === null) return;
        if (this.value.trim() !== "") {
            this.style.color = "#f5f5f5 !important";
        } else {
            this.style.color = "";
        }
    });

    /* FIX: Highlight background when field has a value (change = selects / datepicker / file) */
    field.addEventListener("change", function () {
        if (this.value === undefined || this.value === null) return;
        if (this.value.trim() !== "") {
            this.style.color = "#f5f5f5 !important";
        } else {
            this.style.color = "";
        }
    });

});


/*======== GLOBAL ELEMENTS ============*/
const fullName        = document.getElementById("name");
const email           = document.getElementById("email");
const phone           = document.getElementById("phone");
const dob             = document.getElementById("dob");
const gender          = document.getElementById("gender");
const currentLocation = document.getElementById("location");
const describe        = document.getElementById("describe");

const q_1 = document.getElementById("Question_1");
const q_2 = document.getElementById("Question_2");
const q_3 = document.getElementById("Question_3");
const q_5 = document.getElementById("job_role");
const exp  = document.getElementById("exp");
const work_location = document.getElementById("work_location");
const q_6  = document.getElementById("salary");
const q_7  = document.getElementById("joining_date");
const q_8  = document.getElementById("resume_file");
const q_9  = document.getElementById("addition");

const page1 = document.getElementById("step1_content");
const page2 = document.getElementById("step2_content");
const page3 = document.getElementById("step3_content");


/*======== STEP CIRCLE HELPER ============*/
/* SVG tick mark used for completed steps */
const TICK_SVG = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
  <polyline points="1.5,6 4.5,9.5 10.5,2.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function setCircleState(index, state) {
    const desktopCircles = document.querySelectorAll(".menu_bar .step_circles");
    const mobileCircles = [
        document.getElementById("m_step1_circle"),
        document.getElementById("m_step2_circle"),
        document.getElementById("m_step3_circle")
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
    const desktopMenus  = document.querySelectorAll(".menu_bar .menu_list");
    const mobileLabels  = [
        document.getElementById("m_step1_label"),
        document.getElementById("m_step2_label"),
        document.getElementById("m_step3_label")
    ];

    if (desktopMenus[index]) {
        desktopMenus[index].classList.remove("active", "completed", "disabled");
        desktopMenus[index].classList.add(state);
    }

    if (mobileLabels[index]) {
        mobileLabels[index].classList.remove("active");
        if (state === "active") {
            mobileLabels[index].classList.add("active");
        }
    }
}


/*======== HELPER: Show field error ============*/
function showFieldError(fieldsetId, errorId, message) {
    const fieldset = document.getElementById(fieldsetId);
    const errorMsg = document.getElementById(errorId);
    if (fieldset) fieldset.style.borderColor = "#ff4d4f";
    if (errorMsg) errorMsg.innerText = message;
    const errorBox = fieldset ? fieldset.closest(".input_field").querySelector(".error") : null;
    if (errorBox) errorBox.style.display = "block";
}

/*======== HELPER: Clear field error ============*/
function clearFieldError(fieldsetId, errorId) {
    const fieldset = document.getElementById(fieldsetId);
    const errorMsg = document.getElementById(errorId);
    if (fieldset) fieldset.style.borderColor = "unset";
    if (errorMsg) errorMsg.innerText = "";
    const errorBox = fieldset ? fieldset.closest(".input_field").querySelector(".error") : null;
    if (errorBox) errorBox.style.display = "none";
}

/*======== HELPER: Show inline error on element ============*/
function showInlineError(element, message) {
    if (!element) return;
    element.style.setProperty("border-color", "#ff4d4f", "important");

    /* Try to find or create an error message element after the field */
    let errEl = element.parentElement ? element.parentElement.querySelector(".step3_error_msg") : null;
    if (!errEl) {
        errEl = document.createElement("p");
        errEl.className = "step3_error_msg";
        errEl.style.cssText = "color:#ff4d4f9e;font-size:11px;margin-top:4px;";
        if (element.parentElement) element.parentElement.appendChild(errEl);
    }
    if (message) errEl.innerText = message;
}

/*======== HELPER: Clear inline error on element ============*/
function clearInlineError(element) {
    if (!element) return;
    element.style.removeProperty("border-color");
    const errEl = element.parentElement ? element.parentElement.querySelector(".step3_error_msg") : null;
    if (errEl) errEl.innerText = "";
}


/*======== VALIDATE STEP 1 ============*/
function validateStep1() {
    let isValid = true;

    const nameRegex  = /^[A-Za-z\s]{3,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;

    /* ── NAME ── */
    if (fullName.value.trim() === "") {
        showFieldError("fieldset_name", "name_error", "Full name is required");
        isValid = false;
    } else if (!nameRegex.test(fullName.value.trim())) {
        showFieldError("fieldset_name", "name_error", "Minimum 3 characters, letters only");
        isValid = false;
    } else {
        clearFieldError("fieldset_name", "name_error");
    }

    /* ── AGE ── */
    if (dob.value.trim() === "") {
        showFieldError("fieldset_dob", "dob_error", "Age is required");
        isValid = false;
    } else {
        const age = Number(dob.value.trim());
        if (isNaN(age)) {
            showFieldError("fieldset_dob", "dob_error", "Enter a valid age");
            isValid = false;
        } else if (age < 21) {
            showFieldError("fieldset_dob", "dob_error", "Minimum age is 21");
            isValid = false;
        } else if (age > 45) {
            showFieldError("fieldset_dob", "dob_error", "Maximum age is 45");
            isValid = false;
        } else {
            clearFieldError("fieldset_dob", "dob_error");
        }
    }

    /* ── GENDER ── */
    if (!gender || gender.value.trim() === "") {
        showFieldError("fieldset_gender", "gender_error", "Please select a gender");
        isValid = false;
    } else {
        clearFieldError("fieldset_gender", "gender_error");
    }

    /* ── EMAIL ── */
    if (email.value.trim() === "") {
        showFieldError("fieldset_email", "email_error", "Email is required");
        isValid = false;
    } else if (!emailRegex.test(email.value.trim())) {
        showFieldError("fieldset_email", "email_error", "Enter a valid email");
        isValid = false;
    } else {
        clearFieldError("fieldset_email", "email_error");
    }

    /* ── PHONE ── */
    if (phone.value.trim() === "") {
        showFieldError("fieldset_number", "contact_error", "Contact number is required");
        isValid = false;
    } else if (!phoneRegex.test(phone.value.trim())) {
        showFieldError("fieldset_number", "contact_error", "Enter a valid 10–15 digit phone number");
        isValid = false;
    } else {
        clearFieldError("fieldset_number", "contact_error");
    }

    /* ── LOCATION ── */
    if (currentLocation.value.trim() === "") {
        showFieldError("fieldset_location", "location_error", "Location is required");
        isValid = false;
    } else {
        clearFieldError("fieldset_location", "location_error");
    }

    /* ── DESCRIBE ── */
    if (describe.value.trim() === "") {
        document.getElementById("describe_field").style.setProperty("border-color", "#ff4d4f", "important");
        isValid = false;
    } else {
        document.getElementById("describe_field").style.removeProperty("border-color");
    }

    /* IF ALL VALID → MOVE TO STEP 2 */
    if (isValid) {
        page1.style.display = "none";
        page2.style.display = "block";

        setCircleState(0, "completed");
        setMenuState(0, "completed");
        setCircleState(1, "active");
        setMenuState(1, "active");
    }
}


/*======== VALIDATE STEP 2 ============*/
function validateStep2() {
    let isValid = true;

    const qFields = [q_1, q_2, q_3];
    qFields.forEach(function (f) {
        if (!f) return;
        if (f.value.trim() === "") {
            f.style.setProperty("border-color", "#ff4d4f", "important");
            isValid = false;
        } else {
            f.style.removeProperty("border-color");
        }
    });

    /* IF ALL VALID → MOVE TO STEP 3 */
    if (isValid) {
        page2.style.display = "none";
        page3.style.display = "block";

        setCircleState(1, "completed");
        setMenuState(1, "completed");
        setCircleState(2, "active");
        setMenuState(2, "active");
    }
}


/*======== VALIDATE STEP 3 ============*/
function validateStep3() {
    let isValid = true;

    /* ── PREFERRED ROLE (custom dropdown, hidden input) ── */
    if (!q_5 || q_5.value.trim() === "") {
        const roleWrapper = document.getElementById("job_role_wrapper");
        if (roleWrapper) roleWrapper.style.setProperty("border-color", "#ff4d4f", "important");
        showOrCreateStep3Error("job_role_wrapper", "Please select a preferred role");
        isValid = false;
    } else {
        const roleWrapper = document.getElementById("job_role_wrapper");
        if (roleWrapper) roleWrapper.style.removeProperty("border-color");
        removeStep3Error("job_role_wrapper");
    }

    /* ── EXPERIENCE (custom dropdown, hidden input) ── */
    if (!exp || exp.value.trim() === "") {
        const expWrapper = document.getElementById("exp_wrapper");
        if (expWrapper) expWrapper.style.setProperty("border-color", "#ff4d4f", "important");
        showOrCreateStep3Error("exp_wrapper", "Please select your experience");
        isValid = false;
    } else {
        const expWrapper = document.getElementById("exp_wrapper");
        if (expWrapper) expWrapper.style.removeProperty("border-color");
        removeStep3Error("exp_wrapper");
    }

    /* ── SALARY ── */
    const salaryWrapper = q_6 ? q_6.closest(".salary") : null;
    if (!q_6 || q_6.value.trim() === "") {
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

    /* ── JOINING DATE ── */
    if (!q_7 || q_7.value.trim() === "") {
        q_7.style.setProperty("border-color", "#ff4d4f", "important");
        isValid = false;
        console.log("Asha");
        document.getElementById('joining_date_error_box').style.display="block";
        document.getElementById('joining_date_error').textContent="Please select your available date";
        
    } else {
        q_7.style.removeProperty("border-color");
        document.getElementById('joining_date_error_box').style.display="none";
        document.getElementById('joining_date_error').textContent="";
    }

    /* ── WORK LOCATION (radio buttons) — loop pattern ── */
    var workRadios = document.getElementsByName("Work_Location");
    var workLocationValid = false;
    var selectedWorkLocation = null;
    var wi = 0;
    while (!workLocationValid && wi < workRadios.length) {
        if (workRadios[wi].checked) {
            workLocationValid = true;
            selectedWorkLocation = workRadios[wi];
        }
        wi++;
    }
    const radioGroup = document.getElementById("work_location");
    if (!workLocationValid) {
        if (radioGroup) {
            // radioGroup.style.setProperty("border", "1px solid #ff4d4f", "important");
            radioGroup.style.setProperty("border-radius", "5px", "important");
            radioGroup.style.setProperty("padding", "6px", "important");
        }
        // showOrCreateStep3Error("work_location", "Please select a preferred work location");
        alert("Please select a preferred work location");
        isValid = false;
    } else {
        if (radioGroup) {
            radioGroup.style.removeProperty("border");
            radioGroup.style.removeProperty("border-radius");
            radioGroup.style.removeProperty("padding");
        }
        removeStep3Error("work_location");
    }

    /* ── RESUME FILE ── */
    if (!q_8) {
        console.warn("Element #resume_file not found in the DOM");
        isValid = false;
    } else {
        const file = q_8.files[0];

        if (!file) {
            q_8.style.setProperty("border-color", "#ff4d4f", "important");
            document.getElementById('resume_error_box').style.display="block";
            document.getElementById('resume_error').textContent="Please upload your resume";
            isValid = false;
        } else {
            q_8.style.removeProperty("border-color");
            document.getElementById('joining_date_error_box').style.display="none";

            const allowedTypes = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ];
            const allowedExtensions = ["pdf", "doc", "docx"];
            const fileExt = file.name.toLowerCase().split(".").pop();

            if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
                alert("Only PDF / DOC / DOCX files are allowed");
                q_8.value = "";
                isValid = false;
            } else if (file.size > 5 * 1024 * 1024) {
                alert("Max file size is 5 MB");
                q_8.value = "";
                isValid = false;
            }
        }
    }

    /* ── ADDITIONAL INFO ── */
    if (!q_9 || q_9.value.trim() === "") {
        q_9.style.setProperty("border-color", "#ff4d4f", "important");
        isValid = false;
    } else {
        q_9.style.removeProperty("border-color");
    }

    if (!isValid) return;

    /* Step 3 → completed */
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
    fd.append("preferred_role",  q_5 ? q_5.value.trim() : "");
    fd.append("experience",      exp ? exp.value.trim() : "");
    fd.append("expected_salary", q_6 ? "₹ " + parseInt(q_6.value).toLocaleString("en-IN") : "");
    fd.append("joining_date",    q_7 ? q_7.value.trim() : "");
    fd.append("work_location",   selectedWorkLocation ? selectedWorkLocation.value : "");
    fd.append("resume",          q_8.files[0]);
    fd.append("message",         q_9 ? q_9.value.trim() : "");

    fetch("/submit", {
        method: "POST",
        body: fd
    })
    .then(async function (res) {
        let data;
        try {
            data = await res.json();
        } catch (err) {
            throw new Error("Server not returning JSON");
        }
        if (!res.ok) {
            throw new Error(data.error || "Server error");
        }
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


/*======== STEP 3 ERROR HELPERS ============*/
/**
 * Show (or create) a small error message below a wrapper element.
 * @param {string} wrapperId  - ID of the parent container
 * @param {string} message    - Error text
 */
function showOrCreateStep3Error(wrapperId, message) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    /* Reuse existing error el if already injected */
    let errEl = wrapper.parentElement
        ? wrapper.parentElement.querySelector(".s3-err-" + wrapperId)
        : null;

    if (!errEl) {
        errEl = document.createElement("p");
        errEl.className = "s3-err-" + wrapperId;
        errEl.style.cssText = "color:#ff4d4f9e;font-size:11px;margin-top:4px;font-family:inter,sans-serif;";
        wrapper.insertAdjacentElement("afterend", errEl);
    }
    errEl.innerText = message;
}

/**
 * Remove the injected error message below a wrapper element.
 * @param {string} wrapperId - ID of the parent container
 */
function removeStep3Error(wrapperId) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper || !wrapper.parentElement) return;
    const errEl = wrapper.parentElement.querySelector(".s3-err-" + wrapperId);
    if (errEl) errEl.innerText = "";
}


/**
 * Show (or create) an error message directly after any DOM element (used for salary).
 * @param {Element} anchorEl  - The element to insert the error after
 * @param {string}  className - Unique class name to identify this error node
 * @param {string}  message   - Error text
 */
function showOrCreateErrorAfterEl(anchorEl, className, message) {
    if (!anchorEl) return;

    let errEl = anchorEl.parentElement
        ? anchorEl.parentElement.querySelector("." + className)
        : null;

    if (!errEl) {
        errEl = document.createElement("p");
        errEl.className = className;
        errEl.style.cssText = "color:#ff4d4f9e;font-size:11px;margin-top:5px;font-family:inter,sans-serif;";
        anchorEl.insertAdjacentElement("afterend", errEl);
    }
    errEl.innerText = message;
}

/**
 * Remove a previously injected error message after an element.
 * @param {Element} anchorEl  - The anchor element
 * @param {string}  className - Unique class name used when creating the error
 */
function removeErrorAfterEl(anchorEl, className) {
    if (!anchorEl || !anchorEl.parentElement) return;
    const errEl = anchorEl.parentElement.querySelector("." + className);
    if (errEl) errEl.innerText = "";
}


$(function () {
    $("#joining_date").datepicker({
        dateFormat: "dd/mm/yy",
        minDate: 0,
        beforeShow: function (input, inst) {
            setTimeout(function () {
                inst.dpDiv.css({
                    top:  $(input).offset().top + $(input).outerHeight() + 5,
                    left: $(input).offset().left
                });
            }, 0);
        }
    });
});


/*======== GET EMAIL FROM LOCALSTORAGE ============*/
const storedEmail = localStorage.getItem("userEmail");

if (storedEmail) {
    const profileEmail = document.getElementById("profile_email");
    const profileImg   = document.getElementById("profile_img");
    const mobileIcon   = document.getElementById("mobile_profile_icon");

    if (profileEmail) profileEmail.textContent = storedEmail;

    const firstLetter = storedEmail.charAt(0).toUpperCase();

    if (profileImg)  profileImg.textContent  = firstLetter;
    if (mobileIcon)  mobileIcon.textContent  = firstLetter;
}


/*======== PREVIOUS BUTTONS ============*/
document.addEventListener("DOMContentLoaded", function () {

    /* PREVIOUS — Step 2 → Step 1 */
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

    /* PREVIOUS — Step 3 → Step 2 */
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
