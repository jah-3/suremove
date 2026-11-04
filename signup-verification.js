window.signupVerification = {
    async begin(email, password, metadata) {
        const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password,
            options: { data: metadata }
        });

        if (error) {
            throw error;
        }

        if (data.session) {
            const { error: signOutError } =
                await window.supabaseClient.auth.signOut();
            if (signOutError) {
                throw new Error(
                    "Email verification is disabled, and the signup session could not be closed: " +
                    signOutError.message
                );
            }

            throw new Error(
                "Email-code verification is not enabled for this app. Enable email confirmations in Supabase Auth to require a code before new accounts can sign in."
            );
        }

        return data.user?.email || email;
    },

    async verify(email, token, { keepSession = false } = {}) {
        const { data, error } = await window.supabaseClient.auth.verifyOtp({
            email,
            token,
            type: "signup"
        });

        if (error) {
            throw error;
        }

        if (!data.session) {
            throw new Error("The code was accepted, but no sign-in session was created.");
        }

        if (keepSession) {
            return data.user;
        }

        const { error: signOutError } =
            await window.supabaseClient.auth.signOut();
        if (signOutError) {
            throw new Error(
                "Your email was verified, but sign-out failed: " +
                signOutError.message
            );
        }

        return data.user;
    },

    async finishEmailSignup() {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) {
            throw new Error(
                "Your email was verified, but sign-out failed: " +
                error.message
            );
        }
    },

    async resend(email) {
        const { error } = await window.supabaseClient.auth.resend({
            type: "signup",
            email
        });

        if (error) {
            throw error;
        }
    }
};
