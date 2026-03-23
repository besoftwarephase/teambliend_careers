/*======== COUNTRY CODE ============*/

//   const input = document.querySelector("#phone");

//   const iti = window.intlTelInput(input, {
//     initialCountry: "in",          // Default country (India)
//     separateDialCode: true,        // Shows +91 separately
//     preferredCountries: ["in","us","gb"],
//     utilsScript:
//       "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.21/js/utils.js"
//   });
// if (iti.isValidNumber()) {
//   console.log("Valid number");
// } else {
//   console.log("Invalid number");
// }

/*======== LOADER ============*/
const loader = document.getElementById("myModal");
const closeBtn = document.querySelector(".close");
const submitBtn = document.getElementById("submit_btn");

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

/* CLICK OUTSIDE CLOSE */
window.addEventListener("click", function (e) {
    if (e.target === loader) {
        hideLoader();
    }
});


/*======== HIGHLIGHT TEXTS  ============*/
const fields = document.querySelectorAll(".highlight_text");

fields.forEach(field => {

    field.addEventListener("focusin", function () {

        this.classList.add("active-field");
        this.classList.add("active-text");

        /* remove red border */
        this.style.borderColor = "unset";

        /* find parent input container */
        const container = this.closest(".input_field");

        if (container) {

            /* hide error box */
            const errorBox = container.querySelector(".error");
            if (errorBox) {
                errorBox.style.display = "none";
            }
            /* remove error message */
            const errorText = container.querySelector(".error_messages");
            if (errorText) {
                errorText.innerText = "";
            }

        }

    });

    field.addEventListener("focusout", function () {
        this.classList.remove("active-field");
        this.classList.add("active-text");
    });

});

/*======== GLOBAL ELEMENTS  ============*/
const fullName = document.getElementById("name");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const dob = document.getElementById("dob");
const currentLocation = document.getElementById("location");
const describe = document.getElementById("describe");

const q_1 = document.getElementById("Question_1");
const q_2 = document.getElementById("Question_2");
const q_3 = document.getElementById("Question_3");
const q_4 = document.getElementById("Question_4");
const q_5 = document.getElementById("job_role");
const q_6 = document.getElementById("salary");
const q_7 = document.getElementById("joining_date");
const q_8 = document.getElementById("resume_file");
const q_9 = document.getElementById("addition");

const page1 = document.getElementById("step1_content");
const page2 = document.getElementById("step2_content");
const page3 = document.getElementById("step3_content");


/*======== VALIDATE STEP 1 ============*/
function validateStep1() 
{

    console.log("Asha");

    let isValid = true;

    /* REGEX */
    const nameRegex = /^[A-Za-z\s]{3,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;

    /* NAME VALIDATION */
    if (fullName.value.trim() === "") {

        document.getElementById("fieldset_name").style.borderColor = "#ff4d4f";
        document.getElementById("name_error").innerText = "Full name is required";
        document.querySelector("#fieldset_name").closest(".input_field").querySelector(".error").style.display = "block";
        isValid = false;

    } 
    else if (!nameRegex.test(fullName.value.trim())) {

        document.getElementById("fieldset_name").style.borderColor = "#ff4d4f";
        document.getElementById("name_error").innerText = "Minimum 3 characters, letters only";
        document.querySelector("#fieldset_name").closest(".input_field").querySelector(".error").style.display = "block";
        isValid = false;

    } 
    else 
    {
        document.getElementById("name_error").innerText = "";
        document.getElementById("fieldset_name").style.borderColor = "unset";
        document.querySelector("#fieldset_name").closest(".input_field").querySelector(".error").style.display = "none";
    }
    /* DOB VALIDATION */
    if (dob.value === "") {
        document.getElementById("fieldset_dob").style.borderColor = "#ff4d4f";
        document.getElementById("dob_error").innerText = "Date of birth is required";
        document.querySelector("#fieldset_dob").closest(".input_field").querySelector(".error").style.display = "block";
        isValid = false;
    } 
    else 
    {
        document.getElementById("dob_error").innerText = "";
        document.getElementById("fieldset_dob").style.borderColor = "unset";
        document.querySelector("#fieldset_dob").closest(".input_field").querySelector(".error").style.display = "none";
    }
    /* EMAIL VALIDATION */
    if (email.value.trim() === "") 
    {
        document.getElementById("fieldset_email").style.borderColor = "#ff4d4f";
        document.getElementById("email_error").innerText = "Email is required";
        document.querySelector("#fieldset_email").closest(".input_field").querySelector(".error").style.display = "block";
        isValid = false;
    } 
    else if (!emailRegex.test(email.value.trim())) 
    {
        document.getElementById("fieldset_email").style.borderColor = "#ff4d4f";
        document.getElementById("email_error").innerText = "Enter a valid email";
        document.querySelector("#fieldset_email").closest(".input_field").querySelector(".error").style.display = "block";
        isValid = false;
    } 
    else
    {
        document.getElementById("fieldset_email").style.borderColor = "unset";
        document.getElementById("email_error").innerText = "";
        document.querySelector("#fieldset_email").closest(".input_field").querySelector(".error").style.display = "none";
    }
    /* PHONE VALIDATION */
    if (phone.value.trim() === "") 
    {
        document.getElementById("fieldset_number").style.borderColor = "#ff4d4f";
        document.getElementById("contact_error").innerText = "Contact number required";
        document.querySelector("#fieldset_number").closest(".input_field").querySelector(".error").style.display = "block";
        isValid = false;
    } 
    else if (!phoneRegex.test(phone.value.trim())) 
    {
        document.getElementById("fieldset_number").style.borderColor = "#ff4d4f";
        document.getElementById("contact_error").innerText = "Enter valid phone number";
        document.querySelector("#fieldset_number").closest(".input_field").querySelector(".error").style.display = "block";
        isValid = false;
    } 
    else 
    {
        document.getElementById("fieldset_number").style.borderColor = "unset";
        document.getElementById("contact_error").innerText = "";
        document.querySelector("#fieldset_number").closest(".input_field").querySelector(".error").style.display = "none";
    }
    /* LOCATION VALIDATION */
    if (currentLocation.value.trim() === "") 
    {
        document.getElementById("fieldset_location").style.borderColor = "#ff4d4f";
        document.getElementById("location_error").innerText = "Location required";
        document.querySelector("#fieldset_location").closest(".input_field").querySelector(".error").style.display = "block";
        isValid = false;
    } 
    else 
    {
        document.getElementById("fieldset_location").style.borderColor = "unset";
        document.getElementById("location_error").innerText = "";
        document.querySelector("#fieldset_location").closest(".input_field").querySelector(".error").style.display = "none";
    }
    /* DESCRIPTION VALIDATION */
    if (describe.value.trim() === "") 
    {
        document.getElementById("describe_field").style.setProperty("border-color", "#ff4d4f", "important");
        isValid = false;
    }


    /* IF ALL VALID MOVE TO STEP 2 */
    if (isValid) 
    {
        page1.style.display = "none";
        page2.style.display = "block";

        document.querySelectorAll(".step_circles")[0].classList.remove("active");
        document.querySelectorAll(".step_circles")[0].classList.add("completed");

        document.querySelectorAll(".step_circles")[1].classList.remove("disabled");
        document.querySelectorAll(".step_circles")[1].classList.add("active");

        document.querySelectorAll(".menu_list")[0].classList.remove("active");
        document.querySelectorAll(".menu_list")[0].classList.add("disabled");

        document.querySelectorAll(".menu_list")[1].classList.remove("disabled");
        document.querySelectorAll(".menu_list")[1].classList.add("active");
    }

}

/*======== VALIDATE STEP 2 ============*/

function validateStep2() {
    let isValid = true;

    const fields = [q_1, q_2, q_3, q_4];

    fields.forEach(fields => {

        if (fields.value.trim() === "") {
            fields.style.setProperty('border-color', '#ff4d4f', 'important');
            isValid = false;

        } else {

            fields.style.borderColor = "unset";

        }

    });
    /* IF ALL VALID MOVE TO STEP 3 */
    if (isValid) {

        page2.style.display = "none";
        page3.style.display = "block";

        /* SIDEBAR STATE */
        document.querySelectorAll(".step_circles")[1].classList.remove("active");
        document.querySelectorAll(".step_circles")[1].classList.add("completed");
        document.querySelectorAll(".step_circles")[2].classList.remove("disabled");
        document.querySelectorAll(".step_circles")[2].classList.add("active");

        document.querySelectorAll(".menu_list")[1].classList.remove("active");
        document.querySelectorAll(".menu_list")[1].classList.add("disabled");
        document.querySelectorAll(".menu_list")[2].classList.remove("disabled");
        document.querySelectorAll(".menu_list")[2].classList.add("active");
    }
}

/*======== VALIDATE STEP 3 ============*/
// function validateStep3()
// {
//      let isValid = true;

//     const fields = [q_5, q_6, q_7, q_8, q_9];

//     fields.forEach(fields => {

//         if (fields.value.trim() === "") {
//             fields.style.setProperty('border-color', '#ff4d4f', 'important');
//             isValid = false;

//         } else {

//             fields.style.borderColor = "unset";

//         }

//     });
//     if (isValid) {
    
//     document.querySelectorAll(".step_circles")[2].classList.add("completed");
//     document.querySelectorAll(".step_circles")[2].classList.add("active");
//     document.querySelectorAll(".menu_list")[2].classList.remove("disabled");
//     showLoader();

//     const fd = new FormData();

//     fd.append("name", fullName.value);
//     fd.append("email", email.value);
//     fd.append("phone", phone.value);
//     fd.append("dob", dob.value);
//     fd.append("location", currentLocation.value);
//     fd.append("describe", describe.value);

//     fd.append("q_1", q_1.value);
//     fd.append("q_2", q_2.value);
//     fd.append("q_3", q_3.value);
//     fd.append("q_4", q_4.value);

//     fd.append("preferred_role", q_5.value);
//     fd.append("expected_salary", q_6.value);
//     fd.append("joining_date", q_7.value);

//     if (q_8.files.length === 0) {
//     q_8.style.setProperty('border-color', '#ff4d4f', 'important');
//     isValid = false;
//     } else {
//     fd.append("resume", q_8.files[0]); // ✅ add file to formData
//     }


//     fd.append("message", q_9.value);

//     fetch("http://localhost:3000/submit", {
//     method: "POST",
//     body: fd
// })
// .then(res => {
//     if (!res.ok) {
//         throw new Error("Server error");
//     }
//     return res.json();
// })
// .then(data => {

//     hideLoader();

//     if (data.status === "SUCCESS") {
//         alert("Application submitted successfully!");
//         setTimeout(() => window.location.reload(), 1000);
//     } else {
//         alert("Submission failed");
//     }

// })
// .catch(err => {

//     hideLoader();
//     console.error(err);
//     alert("Server error. Please try again.");

// });
// }
// }

function validateStep3() {
    let isValid = true;

    const fields = [q_5, q_6, q_7, q_9];

    fields.forEach(fields => {

        if (fields.value.trim() === "") {
            fields.style.setProperty('border-color', '#ff4d4f', 'important');
            isValid = false;

        } else {

            fields.style.borderColor = "unset";

        }

    });
    /* FILE VALIDATION */
    const file = q_8.files[0];

    if (!file) {
        alert("Please upload resume");
        isValid = false;
    } else {
        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        if (!allowedTypes.includes(file.type)) {
            alert("Only PDF/DOC/DOCX allowed");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("Max size 5MB");
            return;
        }
    }

    if (!isValid) return;
    document.querySelectorAll(".step_circles")[2].classList.add("completed");
    document.querySelectorAll(".step_circles")[2].classList.add("active");
    document.querySelectorAll(".menu_list")[2].classList.remove("disabled");

    showLoader();

     const fd = new FormData();

    fd.append("name", fullName.value);
    fd.append("email", email.value);
    fd.append("phone", phone.value);
    fd.append("dob", dob.value);
    fd.append("location", currentLocation.value);
    fd.append("describe", describe.value);

    fd.append("q_1", q_1.value);
    fd.append("q_2", q_2.value);
    fd.append("q_3", q_3.value);
    fd.append("q_4", q_4.value);

    fd.append("preferred_role", q_5.value);
    fd.append("expected_salary", q_6.value);
    fd.append("joining_date", q_7.value);

    fd.append("resume", file);
    fd.append("message", q_9.value);

    /* ✅ FIXED API URL */
   fetch("/submit", {
    method: "POST",
    body: fd
})
.then(async res => {

    let data;

    try {
        data = await res.json();  // ✅ directly parse JSON
    } catch (err) {
        throw new Error("Server not returning JSON");
    }

    if (!res.ok) {
        throw new Error(data.error || "Server error");
    }

    return data;
})
.then(data => {
    hideLoader();

    alert("Application submitted successfully!");
    window.location.reload();
})
.catch(err => {
    hideLoader();
    console.error("ERROR:", err);
    alert(err.message);
});

}


/*======== PREVIOUS STEP 2 ============*/
var prevBtn2 = document.getElementById('prevBtn2');
console.log("previous")

prevBtn2.addEventListener("click", function () {

    page2.style.display = "none";
    page1.style.display = "block";

    /* SIDEBAR STYLE */
    document.querySelectorAll(".step_circles")[1].classList.remove("active");
    document.querySelectorAll(".step_circles")[1].classList.add("disabled");

    document.querySelectorAll(".step_circles")[0].classList.remove("completed");
    document.querySelectorAll(".step_circles")[0].classList.add("active");

    document.querySelectorAll(".menu_list")[1].classList.remove("active");
    document.querySelectorAll(".menu_list")[1].classList.add("disabled");

    document.querySelectorAll(".menu_list")[0].classList.remove("disabled");
    document.querySelectorAll(".menu_list")[0].classList.add("active");

});

/*======== PREVIOUS STEP 3 ============*/
var prevBtn3 = document.getElementById('prevBtn3');
prevBtn3.addEventListener("click", function () {

    page3.style.display = "none";
    page2.style.display = "block";

    /* SIDEBAR STYLE */
    document.querySelectorAll(".step_circles")[2].classList.remove("active");
    document.querySelectorAll(".step_circles")[2].classList.add("disabled");

    document.querySelectorAll(".step_circles")[1].classList.remove("completed");
    document.querySelectorAll(".step_circles")[1].classList.add("active");

    document.querySelectorAll(".menu_list")[2].classList.remove("active");
    document.querySelectorAll(".menu_list")[2].classList.add("disabled");

    document.querySelectorAll(".menu_list")[1].classList.remove("disabled");
    document.querySelectorAll(".menu_list")[1].classList.add("active");

});

$(function () {

$("#dob").datepicker({
    dateFormat: "mm/dd/yy",
    duration: "fast",
    minDate: new Date(1995, 0, 1),
    maxDate: 0,
    defaultDate: new Date(1995, 0, 1)
});

$("#joining_date").datepicker({
    dateFormat: "mm/dd/yy",
    minDate: 0,
    beforeShow: function(input, inst) {
        setTimeout(function () {
            inst.dpDiv.css({
                top: $(input).offset().top + $(input).outerHeight() + 5,
                left: $(input).offset().left
            });
        }, 0);
    }
});

});

/*========== GET EMAIL ===========*/
const storedEmail = localStorage.getItem("userEmail");

// display it in div
if (storedEmail) {
    document.getElementById("profile_email").textContent = storedEmail;
    console.log(storedEmail)
    let arr = storedEmail.split("");
    let firstLetter = arr[0];
    let result = firstLetter.charAt(0).toUpperCase() + firstLetter.slice(1);
    console.log(result);
    document.getElementById('profile_img').textContent =result;
}




const countryCode = document.getElementById("countryCode");
const phoneNumber = document.getElementById("phone");

function getFullNumber() {
    const fullNumber = countryCode.value + phoneNumber.value;
    console.log(fullNumber);
}


