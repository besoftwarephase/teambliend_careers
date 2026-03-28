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
        if (this.value.trim() !== "") {
            this.style.backgroundColor = "#f5f5f5";
        } else {
            this.style.backgroundColor = "";
        }
    });

    /* FIX: Highlight background when field has a value (change = selects / datepicker / file) */
    field.addEventListener("change", function () {
        if (this.value.trim() !== "") {
            this.style.backgroundColor = "#f5f5f5";
        } else {
            this.style.backgroundColor = "";
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


/*======== VALIDATE STEP 1 ============*/
function validateStep1() {
    let isValid = true;

    const nameRegex  = /^[A-Za-z\s]{3,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;

    /* NAME */
    if (fullName.value.trim() === "") {
        document.getElementById("fieldset_name").style.borderColor = "#ff4d4f";
        document.getElementById("name_error").innerText = "Full name is required";
        document.querySelector("#fieldset_name").closest(".input_field").querySelector(".error").style.display = "block";
        isValid = false;
    } else if (!nameRegex.test(fullName.value.trim())) {
        document.getElementById("fieldset_name").style.borderColor = "#ff4d4f";
        document.getElementById("name_error").innerText = "Minimum 3 characters, letters only";
        document.querySelector("#fieldset_name").closest(".input_field").querySelector(".error").style.display = "block";
        isValid = false;
    } else {
        document.getElementById("name_error").innerText = "";
        document.getElementById("fieldset_name").style.borderColor = "unset";
        document.querySelector("#fieldset_name").closest(".input_field").querySelector(".error").style.display = "none";
    }

    /* GENDER */
    if (gender.value === "") {
        document.getElementById("fieldset_gender").style.borderColor = "#ff4d4f";
        document.getElementById("gender_error").innerText = "Gender field is required";
        document.querySelector("#fieldset_gender").closest(".input_field").querySelector(".error").style.display = "block";
        isValid = false;
    } else {
        document.getElementById("gender_error").innerText = "";
        document.getElementById("fieldset_gender").style.borderColor = "unset";
        document.querySelector("#fieldset_gender").closest(".input_field").querySelector(".error").style.display = "none";
    }

    /* AGE */
    if (dob.value.trim() === "") {
        document.getElementById("fieldset_dob").style.borderColor = "#ff4d4f";
        document.getElementById("dob_error").innerText = "Age is required";
        document.querySelector("#fieldset_dob").closest(".input_field").querySelector(".error").style.display = "block";
        isValid = false;
    } else {
        const age = Number(dob.value.trim());
        if (isNaN(age)) {
            document.getElementById("fieldset_dob").style.borderColor = "#ff4d4f";
            document.getElementById("dob_error").innerText = "Enter valid age";
            document.querySelector("#fieldset_dob").closest(".input_field").querySelector(".error").style.display = "block";
            isValid = false;
        } else if (age < 21) {
            document.getElementById("fieldset_dob").style.borderColor = "#ff4d4f";
            document.getElementById("dob_error").innerText = "Minimum age is 21";
            document.querySelector("#fieldset_dob").closest(".input_field").querySelector(".error").style.display = "block";
            isValid = false;
        } else if (age > 45) {
            document.getElementById("fieldset_dob").style.borderColor = "#ff4d4f";
            document.getElementById("dob_error").innerText = "Maximum age is 45";
            document.querySelector("#fieldset_dob").closest(".input_field").querySelector(".error").style.display = "block";
            isValid = false;
        } else {
            document.getElementById("dob_error").innerText = "";
            document.getElementById("fieldset_dob").style.borderColor = "unset";
            document.querySelector("#fieldset_dob").closest(".input_field").querySelector(".error").style.display = "none";
        }
    }

    /* EMAIL */
    if (email.value.trim() === "") {
        document.getElementById("fieldset_email").style.borderColor = "#ff4d4f";
        document.getElementById("email_error").innerText = "Email is required";
        document.querySelector("#fieldset_email").closest(".input_field").querySelector(".error").style.display = "block";
        isValid = false;
    } else if (!emailRegex.test(email.value.trim())) {
        document.getElementById("fieldset_email").style.borderColor = "#ff4d4f";
        document.getElementById("email_error").innerText = "Enter a valid email";
        document.querySelector("#fieldset_email").closest(".input_field").querySelector(".error").style.display = "block";
        isValid = false;
    } else {
        document.getElementById("fieldset_email").style.borderColor = "unset";
        document.getElementById("email_error").innerText = "";
        document.querySelector("#fieldset_email").closest(".input_field").querySelector(".error").style.display = "none";
    }

    /* PHONE */
    if (phone.value.trim() === "") {
        document.getElementById("fieldset_number").style.borderColor = "#ff4d4f";
        document.getElementById("contact_error").innerText = "Contact number required";
        document.querySelector("#fieldset_number").closest(".input_field").querySelector(".error").style.display = "block";
        isValid = false;
    } else if (!phoneRegex.test(phone.value.trim())) {
        document.getElementById("fieldset_number").style.borderColor = "#ff4d4f";
        document.getElementById("contact_error").innerText = "Enter valid phone number";
        document.querySelector("#fieldset_number").closest(".input_field").querySelector(".error").style.display = "block";
        isValid = false;
    } else {
        document.getElementById("fieldset_number").style.borderColor = "unset";
        document.getElementById("contact_error").innerText = "";
        document.querySelector("#fieldset_number").closest(".input_field").querySelector(".error").style.display = "none";
    }

    /* LOCATION */
    if (currentLocation.value.trim() === "") {
        document.getElementById("fieldset_location").style.borderColor = "#ff4d4f";
        document.getElementById("location_error").innerText = "Location required";
        document.querySelector("#fieldset_location").closest(".input_field").querySelector(".error").style.display = "block";
        isValid = false;
    } else {
        document.getElementById("fieldset_location").style.borderColor = "unset";
        document.getElementById("location_error").innerText = "";
        document.querySelector("#fieldset_location").closest(".input_field").querySelector(".error").style.display = "none";
    }

    /* DESCRIBE */
    if (describe.value.trim() === "") {
        document.getElementById("describe_field").style.setProperty("border-color", "#ff4d4f", "important");
        isValid = false;
    } else {
        document.getElementById("describe_field").style.setProperty("border-color", "unset", "important");
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
        if (f.value.trim() === "") {
            f.style.setProperty("border-color", "#ff4d4f", "important");
            isValid = false;
        } else {
            f.style.borderColor = "unset";
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

    const stepFields = [q_5, exp, q_6, q_7, q_9];
    stepFields.forEach(function (field) {
        if (field.value.trim() === "") {
            field.style.setProperty("border-color", "#ff4d4f", "important");
            isValid = false;
        } else {
            field.style.borderColor = "unset";
        }
    });

    /* SALARY — must be a number */
    if (q_6.value.trim() !== "" && isNaN(parseInt(q_6.value))) {
        q_6.style.setProperty("border-color", "#ff4d4f", "important");
        isValid = false;
    }

    /* FILE VALIDATION */
    const file = q_8.files[0];

    if (!file) {
        q_8.style.setProperty("border-color", "#ff4d4f", "important");
        isValid = false;
    } else {
        q_8.style.borderColor = "unset";

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
            alert("Max file size is 5MB");
            q_8.value = "";
            isValid = false;
        }
    }

    if (!isValid) return;

    /* Step 3 → completed */
    setCircleState(2, "completed");
    setMenuState(2, "completed");

    showLoader();

    const fd = new FormData();
    fd.append("name",            fullName.value);
    fd.append("email",           email.value);
    fd.append("phone",           phone.value);
    fd.append("dob",             dob.value);
    fd.append("gender",          gender.value);
    fd.append("location",        currentLocation.value);
    fd.append("describe",        describe.value);
    fd.append("q_1",             q_1.value);
    fd.append("q_2",             q_2.value);
    fd.append("q_3",             q_3.value);
    fd.append("preferred_role",  q_5.value);
    fd.append("experience",      exp.value);
    fd.append("expected_salary", "₹ " + parseInt(q_6.value).toLocaleString("en-IN"));
    fd.append("joining_date",    q_7.value);
    fd.append("resume",          file);
    fd.append("message",         q_9.value);

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


/*======== DATEPICKER ============*/
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
