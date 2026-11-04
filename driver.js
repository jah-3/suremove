document.addEventListener("DOMContentLoaded", async function () {
    const client = window.supabaseClient;
    const message = document.getElementById("driver-auth-message");
    const loginForm = document.getElementById("driver-login-form");
    const signupForm = document.getElementById("driver-signup-form");
    const verificationForm = document.getElementById("driver-verification-form");
    const loginButton = document.getElementById("driver-login-button");
    const signupButton = document.getElementById("driver-signup-button");
    const verifyButton = document.getElementById("driver-verify-button");
    const resendCodeButton = document.getElementById("driver-resend-code-button");
    const editEmailButton = document.getElementById("driver-edit-email-button");
    const facebookLoginButton = document.getElementById("driver-facebook-login");
    const showLoginButton = document.getElementById("show-driver-login");
    const showSignupButton = document.getElementById("show-driver-signup");
    const verificationEmailLabel = document.getElementById(
        "driver-verification-email"
    );
    let verificationEmail = "";

    function showMessage(text) {
        message.textContent = text;
    }

    function showAccountForm(form) {
        const showingLogin = form === "login";
        loginForm.hidden = !showingLogin;
        signupForm.hidden = showingLogin;
        verificationForm.hidden = true;
        facebookLoginButton.hidden = !showingLogin;
        showLoginButton.hidden = false;
        showSignupButton.hidden = false;
        showLoginButton.setAttribute("aria-pressed", String(showingLogin));
        showSignupButton.setAttribute("aria-pressed", String(!showingLogin));
        showMessage("");
    }

    async function routeByRole(user) {
        const { data, error } = await client
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle();
        if (error) throw new Error("Could not verify account role: " + error.message);

        const pages = {
            admin: "index.html",
            driver: "driver-dashboard.html",
            supplier: "supplier-dashboard.html"
        };
        const destination = pages[data?.role];
        if (!destination) {
            await client.auth.signOut();
            throw new Error("No role is assigned to this account. Run the Supabase setup SQL, then sign in again.");
        }
        window.location.replace(destination);
    }

    if (!client) {
        showMessage("Supabase is unavailable. Check supabase.js and reload.");
        return;
    }

    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) {
        showMessage("Could not check sign-in: " + sessionError.message);
        return;
    }
    if (sessionData.session) {
        try {
            await routeByRole(sessionData.session.user);
        } catch (error) {
            console.error("Driver portal routing error:", error);
            showMessage(error.message);
        }
        return;
    }

    showLoginButton.addEventListener("click", function () {
        showAccountForm("login");
        document.getElementById("driver-login-email").focus();
    });

    showSignupButton.addEventListener("click", function () {
        showAccountForm("signup");
        document.getElementById("driver-signup-email").focus();
    });

    facebookLoginButton.addEventListener("click", async function () {
        if (!["http:", "https:"].includes(window.location.protocol)) {
            showMessage("Facebook sign-in requires opening this site through localhost or its deployed HTTPS address.");
            return;
        }

        facebookLoginButton.disabled = true;
        showMessage("Connecting to Facebook...");
        try {
            const { error } = await client.auth.signInWithOAuth({
                provider: "facebook",
                options: {
                    scopes: "email",
                    redirectTo: new URL(window.location.pathname, window.location.origin).href
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error("Driver Facebook sign-in failed:", error);
            showMessage(error.message || "Could not start Facebook sign-in. Please try again.");
            facebookLoginButton.disabled = false;
        }
    });

    verificationForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        verifyButton.disabled = true;
        showMessage("Verifying your email...");

        try {
            await window.signupVerification.verify(
                verificationEmail,
                document.getElementById("driver-verification-code").value.trim(),
                { keepSession: true }
            );
            await window.signupVerification.finishEmailSignup();
            verificationForm.hidden = true;
            showAccountForm("login");
            document.getElementById("driver-login-email").value = verificationEmail;
            showMessage("Email verified. Your driver account is ready. Sign in with your email and password.");
        } catch (error) {
            console.error("Could not verify driver signup email:", error);
            showMessage(error.message || "Could not verify the email code.");
        } finally {
            verifyButton.disabled = false;
        }
    });

    resendCodeButton.addEventListener("click", async function () {
        resendCodeButton.disabled = true;
        showMessage("Sending a new code to " + verificationEmail + "...");
        try {
            await window.signupVerification.resend(verificationEmail);
            showMessage("A new code was requested for " + verificationEmail + ". Check your inbox and spam folder.");
        } catch (error) {
            console.error("Could not resend driver verification code:", error);
            const detail = error.message || "Could not resend the verification code.";
            showMessage(
                detail +
                (detail.toLowerCase().includes("not authorized")
                    ? " Supabase's default mailer only sends to project team addresses; configure custom SMTP to send to other drivers."
                    : "")
            );
        } finally {
            resendCodeButton.disabled = false;
        }
    });

    editEmailButton.addEventListener("click", function () {
        showAccountForm("signup");
        document.getElementById("driver-signup-email").focus();
        showMessage("Check the email address, then create the driver account again.");
    });

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        loginButton.disabled = true;
        showMessage("Signing in...");
        const { data, error } = await client.auth.signInWithPassword({
            email: document.getElementById("driver-login-email").value.trim(),
            password: document.getElementById("driver-login-password").value
        });
        loginButton.disabled = false;
        if (error) {
            showMessage("Could not sign in: " + error.message);
            return;
        }
        try {
            await routeByRole(data.user);
        } catch (roleError) {
            console.error("Driver sign-in role error:", roleError);
            showMessage(roleError.message);
            await client.auth.signOut();
        }
    });

    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        signupButton.disabled = true;
        showMessage("Creating driver account...");
        try {
            verificationEmail = await window.signupVerification.begin(
                document.getElementById("driver-signup-email").value.trim(),
                document.getElementById("driver-signup-password").value,
                { app_role: "driver" }
            );
            verificationEmailLabel.textContent = verificationEmail;
            signupForm.hidden = true;
            verificationForm.hidden = false;
            showLoginButton.hidden = true;
            showSignupButton.hidden = true;
            showMessage("Check " + verificationEmail + " for the six-digit code. Check spam, then use Resend Code if needed.");
        } catch (error) {
            console.error("Could not create driver account:", error);
            showMessage(error.message || "Could not create the driver account.");
        } finally {
            signupButton.disabled = false;
        }
    });
});
