document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("register-form");
    const verificationForm = document.getElementById(
        "register-verification-form"
    );
    const registerMessage = document.getElementById("register-message");
    const resendCodeButton = document.getElementById("register-resend-code");
    let verificationEmail = "";
    let signupRole = "supplier";

    verificationForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const token = document.getElementById("register-code").value.trim();
        registerMessage.style.color = "#fecdd3";
        registerMessage.textContent = "Verifying your email...";

        try {
            await window.signupVerification.verify(
                verificationEmail,
                token,
                { keepSession: true }
            );
            await window.signupVerification.finishEmailSignup();
            verificationForm.hidden = true;
            registerMessage.style.color = "#a7f3d0";
            registerMessage.textContent =
                "Email verified. Your " + signupRole +
                " account is ready. Sign in with your email and password.";
        } catch (error) {
            console.error("Could not verify signup email:", error);
            registerMessage.style.color = "#fecdd3";
            registerMessage.textContent =
                error.message || "Could not verify the email code.";
        }
    });

    resendCodeButton.addEventListener("click", async function () {
        resendCodeButton.disabled = true;
        registerMessage.style.color = "";
        registerMessage.textContent = "Sending a new verification code...";

        try {
            await window.signupVerification.resend(verificationEmail);
            registerMessage.style.color = "#a7f3d0";
            registerMessage.textContent =
                "If the address can receive a verification code, a new one has been sent. Check your inbox and spam folder.";
        } catch (error) {
            console.error("Could not resend signup verification code:", error);
            registerMessage.style.color = "#fecdd3";
            registerMessage.textContent =
                error.message || "Could not resend the verification code.";
        } finally {
            resendCodeButton.disabled = false;
        }
    });

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = document.getElementById("new-username").value.trim();
        const email = document.getElementById("new-email").value.trim();
        const password = document.getElementById("new-password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        const selectedRole = document.querySelector(
            'input[name="account-role"]:checked'
        );


        if (!username || !email || !password || !confirmPassword) {
            registerMessage.style.color = "#fecdd3";
            registerMessage.textContent = "Please fill in all required fields.";
            return;
        }

        if (!selectedRole || !["supplier", "driver"].includes(selectedRole.value)) {
            registerMessage.style.color = "#fecdd3";
            registerMessage.textContent = "Choose whether this account is for a supplier or driver.";
            return;
        }

        if (password !== confirmPassword) {
            registerMessage.style.color = "#fecdd3";
            registerMessage.textContent = "Passwords do not match.";
            return;
        }

        if (!window.supabaseClient) {
            registerMessage.style.color = "#fecdd3";
            registerMessage.textContent =
                "Supabase is unavailable. Check your internet connection and reload the page.";
            return;
        }

        try {
            signupRole = selectedRole.value;
            verificationEmail = await window.signupVerification.begin(
                email,
                password,
                { username, app_role: signupRole }
            );
            registerForm.hidden = true;
            verificationForm.hidden = false;
            registerMessage.style.color = "";
            registerMessage.textContent =
                "Enter the 6-digit code sent to your email address. Check your spam folder if needed.";
        } catch (error) {
            console.error("Supabase signup failed:", error);
            registerMessage.style.color = "#fecdd3";
            registerMessage.textContent = error.message ||
                "Could not create the account. Check your connection and try again.";
        }
    });
});
