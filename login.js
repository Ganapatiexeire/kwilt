document.addEventListener("DOMContentLoaded", async function () {

    const CART_ID_KEY = '__cid';

    var getLabelText = function (input) {
        var label = input.closest("label");
        if (label) return label.textContent.trim();
        var forLabel = document.querySelector("label[for='" + input.id + "']");
        return forLabel ? forLabel.textContent.trim() : (input.placeholder || input.name || "This field");
    };

    var showError = function (input, customMessage) {
        if (!input) return;

        var idKey = input.id || input.name;
        if (!idKey) {
            if (!input.dataset._errorId) {
                input.dataset._errorId = "i" + Math.random().toString(36).slice(2, 8);
            }
            idKey = input.dataset._errorId;
        }
        var errorId = idKey + "-error";
        var existingError = document.getElementById(errorId);
        var labelText = getLabelText(input);
        var errorText = customMessage || labelText + " is required.";

        var insertAfterNode;
        var intakeWrapper = input.closest(".intake-input-wrapper, .password-wrapper, .intake-radio-btn-wrapper, .intake-checkbox-container");
        if (intakeWrapper) {
            insertAfterNode = intakeWrapper;
        } else {
            var parent = input.parentElement;
            var hasOtherInteractiveElements =
                parent && Array.prototype.some.call(parent.children, function (el) {
                    return el !== input && (el.tagName === "BUTTON" || el.tagName === "SVG" || (el.querySelector && el.querySelector("svg")));
                });
            insertAfterNode = hasOtherInteractiveElements ? parent : input;
        }

        if (existingError) {
            existingError.textContent = errorText;
            existingError.classList.add("show");
            input.classList.add("input-error");
            return;
        }

        var errorMessage = document.createElement("div");
        errorMessage.className = "error-message";
        errorMessage.id = errorId;
        errorMessage.textContent = errorText;
        insertAfterNode.insertAdjacentElement("afterend", errorMessage);

        requestAnimationFrame(function () {
            errorMessage.classList.add("show");
        });

        input.classList.add("input-error");
    };

    var removeError = function (input) {
        input.classList.remove("input-error");
        var idKey = input.id || input.name || input.dataset._errorId;
        if (!idKey) return;
        var errorId = idKey + "-error";
        var existingError = document.getElementById(errorId);
        if (existingError) existingError.remove();
    };

    var validateLoginInput = function (input) {
        var value = input.value.trim();
        var valid = true;

        if (input.type === "email" || input.name === "email") {
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                showError(input, "Please enter a valid email address.");
                valid = false;
            }
        } else if (input.type === "password" || input.name === "password") {
            if (!value) {
                showError(input, "Password is required.");
                valid = false;
            } else if (value.length < 6) {
                showError(input, "Password must be at least 6 characters.");
                valid = false;
            }
        }

        if (valid) removeError(input);
        return valid;
    };

    var validateLoginForm = function (formEl) {
        var inputs = formEl.querySelectorAll("input[required]");
        var isValid = true;
        inputs.forEach(function (input) {
            if (!validateLoginInput(input)) isValid = false;
        });
        return isValid;
    };

    var attachLiveLoginValidation = function (formEl) {
        var inputs = formEl.querySelectorAll("input[required]");
        inputs.forEach(function (input) {
            input.addEventListener("input", function () { validateLoginInput(input); });
            input.addEventListener("blur", function () { validateLoginInput(input); });
        });
    };

    var getLoginFormData = function (formEl) {
        var data = {};
        formEl.querySelectorAll("input").forEach(function (input) {
            data[input.name] = input.value.trim();
        });
        return data;
    };

    var setBtnLoading = function (btn, isLoading) {
        if (!btn) return;
        if (isLoading) {
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = '<span class="loader"></span>';
            btn.disabled = true;
        } else {
            btn.innerHTML = btn.dataset.originalText || "Login";
            btn.disabled = false;
        }
    };

    async function handleLogin(payload) {
        const btnEl = document.querySelector(".member-login-btn");
        let errorEl = document.querySelector(".form-error-message");
        try {
            if (errorEl) {
                errorEl.remove();
            }
            setBtnLoading(btnEl, true);
            const p = { ...payload, username: payload.email }
            const res = await fetch('https://kwilt-intake-396730550724.us-central1.run.app/auth/signin', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(p),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Login failed");
            }

            const data = await res.json();
            if (data && data.data) {
                localStorage.setItem('atkn', data.data)

                // Braze Tracking: Login Success
                if (window.trackEvent) {
                    const eventProperties = {
                        email: payload.email,
                        timestamp: new Date().toISOString()
                    };
                    window.trackEvent('login_success', eventProperties);
                    console.log('Braze event fired: login_success', eventProperties);
                }

                // --- NEW: Merge Cart Logic ---
                const cartId = localStorage.getItem(CART_ID_KEY);
                if (cartId) {
                    try {
                        const mergePayload = { "__cid": cartId };
                        const mergeHeaders = {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${data.data}`
                        };
                        const mergeResponse = await fetch('https://kwilt-order-396730550724.us-central1.run.app/nonrx-cart/mergecart', {
                            method: "POST",
                            headers: mergeHeaders,
                            body: JSON.stringify(mergePayload),
                        });

                        if (!mergeResponse.ok) {
                            const mergeErr = await mergeResponse.json().catch(() => ({}));
                            console.error('Cart merge failed:', mergeErr.message || `API request failed with status ${mergeResponse.status}`);
                            // Do not throw error here, as login was successful. Just log.
                        } else {
                            localStorage.removeItem(CART_ID_KEY); // Remove __cid on successful merge
                            console.log('Cart merged successfully and __cid removed from localStorage.');
                        }
                    } catch (mergeError) {
                        console.error('Error during cart merge:', mergeError);
                        // Do not throw error here, as login was successful. Just log.
                    }
                }
                // --- END NEW: Merge Cart Logic ---

                window.location.href = '/'
            }
        } catch (err) {
            // Braze Tracking: Login Failed
            if (window.trackEvent) {
                const eventProperties = {
                    email: payload.email,
                    timestamp: new Date().toISOString()
                };
                window.trackEvent('login_failed', eventProperties);
                console.log('Braze event fired: login_failed', eventProperties);
            }

            errorEl = document.createElement("div");
            errorEl.className = "form-error-message";
            errorEl.textContent = "Login failed. Please check your credentials and try again.";

            btnEl.insertAdjacentElement("beforebegin", errorEl);
            throw err;
        } finally {
            setBtnLoading(btnEl, false);
        }
    }


    document.addEventListener("click", async function (e) {
        if (e.target.closest(".toggle-password")) {
            var btn = e.target.closest(".toggle-password");
            if (!btn) return;

            var targetId = btn.dataset.target;
            var input = document.getElementById(targetId);
            var eye = btn.querySelector(".icon-eye");
            var eyeOff = btn.querySelector(".icon-eye-off");

            if (!input) return;

            if (input.type === "password") {
                input.type = "text";
                if (eye) eye.style.display = "none";
                if (eyeOff) eyeOff.style.display = "block";
            } else {
                input.type = "password";
                if (eye) eye.style.display = "block";
                if (eyeOff) eyeOff.style.display = "none";
            }
        }

        if (e.target.closest(".member-login-btn")) {
            e.preventDefault();
            var formEl = document.querySelector(".member-login-form");
            if (!formEl) return;

            var loginData = getLoginFormData(formEl);

            // Braze Tracking: Login Attempted
            if (window.trackEvent) {
                const eventProperties = {
                    email: loginData.email,
                    timestamp: new Date().toISOString()
                };
                window.trackEvent('login_attempted', eventProperties);
                console.log('Braze event fired: login_attempted', eventProperties);
            }

            attachLiveLoginValidation(formEl);

            if (validateLoginForm(formEl)) {
                await handleLogin(loginData)

            }
        }
    });

    document.addEventListener("keydown", async function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            var formEl = document.querySelector(".member-login-form");
            if (!formEl) return;

            var loginData = getLoginFormData(formEl);
            // Braze Tracking: Login Attempted
            if (window.trackEvent) {
                const eventProperties = {
                    email: loginData.email,
                    timestamp: new Date().toISOString()
                };
                window.trackEvent('login_attempted', eventProperties);
                console.log('Braze event fired: login_attempted', eventProperties);
            }

            if (validateLoginForm(formEl)) {
                await handleLogin(loginData)
            }
        }
    });
});
