document.addEventListener("DOMContentLoaded", async function () {
    const client = window.supabaseClient;
    const facebookIdentityStatus = document.getElementById("facebook-identity-status");
    const linkFacebookButton = document.getElementById("link-facebook-identity");
    const returnButtons = [
        document.getElementById("return-to-sign-in"),
        document.getElementById("return-to-sign-in-bottom")
    ];
    const facebookLinkReturn =
        sessionStorage.getItem("facebookLinkPending") === "1";
    if (facebookLinkReturn) {
        sessionStorage.removeItem("facebookLinkPending");
    }
    async function returnToSignIn() {
        returnButtons.forEach(item => {
            item.disabled = true;
        });

        try {
            if (client) {
                const { error: signOutError } =
                    await client.auth.signOut({ scope: "local" });
                if (signOutError) throw signOutError;
            }

            sessionStorage.removeItem("isLoggedIn");
            window.location.replace("login.html");
        } catch (signOutError) {
            console.error("Could not return to sign-in:", signOutError);
            facebookIdentityStatus.textContent =
                "Could not return to sign-in: " +
                signOutError.message +
                " Please try again.";
            returnButtons.forEach(item => {
                item.disabled = false;
            });
        }
    }

    returnButtons.forEach(button => {
        button.addEventListener("click", function () {
            returnToSignIn();
        });
    });

    if (!client) {
        facebookIdentityStatus.textContent =
            "Supabase is unavailable. Check supabase.js and reload.";
        return;
    }

    const { data, error } = await client.auth.getSession();
    if (error) {
        console.error("Could not check the signed-in account:", error);
        facebookIdentityStatus.textContent =
            "Could not check your sign-in status: " +
            error.message +
            " Please sign in again and retry.";
        return;
    }
    if (!data.session) {
        window.location.replace("login.html");
        return;
    }

    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError) {
        console.error("Could not check linked sign-in methods:", userError);
        facebookIdentityStatus.textContent =
            "Could not check linked sign-in methods: " + userError.message;
        linkFacebookButton.disabled = true;
    } else {
        const hasFacebookIdentity = (userData.user.identities || []).some(
            identity => identity.provider === "facebook"
        );
        if (hasFacebookIdentity) {
            facebookIdentityStatus.textContent = "Facebook is connected to this account.";
            linkFacebookButton.textContent = "Facebook connected";
            linkFacebookButton.disabled = true;

            if (facebookLinkReturn) {
                facebookIdentityStatus.textContent =
                    "Facebook is connected. Returning to your portal...";
                const { data: roleData, error: roleError } = await client
                    .from("user_roles")
                    .select("role")
                    .eq("user_id", userData.user.id)
                    .maybeSingle();

                if (roleError) {
                    console.error("Could not load the account role after Facebook linking:", roleError);
                    facebookIdentityStatus.textContent =
                        "Facebook is connected, but your portal could not be opened: " +
                        roleError.message;
                } else {
                    const rolePages = {
                        admin: "index.html",
                        driver: "driver-dashboard.html",
                        supplier: "supplier-dashboard.html"
                    };
                    const destination = rolePages[roleData?.role];

                    if (!destination) {
                        facebookIdentityStatus.textContent =
                            "Facebook is connected, but this account has no portal role. Contact your administrator.";
                    } else {
                        sessionStorage.setItem("isLoggedIn", "true");
                        window.location.replace(destination);
                        return;
                    }
                }
            }
        }

        linkFacebookButton.addEventListener("click", async function () {
            if (!["http:", "https:"].includes(window.location.protocol)) {
                facebookIdentityStatus.textContent =
                    "Facebook linking requires opening the site through localhost or its deployed HTTPS address.";
                return;
            }

            linkFacebookButton.disabled = true;
            facebookIdentityStatus.textContent = "Connecting to Facebook...";
            sessionStorage.setItem("facebookLinkPending", "1");
            try {
                const { error: linkError } = await client.auth.linkIdentity({
                    provider: "facebook",
                    options: {
                        scopes: "email",
                        redirectTo: new URL("account-phone.html", window.location.href).href
                    }
                });
                if (linkError) throw linkError;
            } catch (linkError) {
                sessionStorage.removeItem("facebookLinkPending");
                console.error("Could not link Facebook identity:", linkError);
                facebookIdentityStatus.textContent =
                    linkError.message || "Could not link Facebook. Please try again.";
                linkFacebookButton.disabled = false;
            }
        });
    }

});
