// Kwilt Checkout Page v1.0 - API Integrated

(function () {
    // --- API CONFIGURATION ---
    const API_BASE_URL = 'https://kwilt-order-396730550724.us-central1.run.app';
    const MYACCOUNT_API_BASE_URL = 'https://kwilt-myaccount-396730550724.us-central1.run.app';
    const ATKN_KEY = 'atkn'; // Authentication token key in localStorage
    const CART_ID_KEY = '__cid'; // Cart ID key from cart.js

    // --- STATE MANAGEMENT ---
    let checkoutState = {
        isAuthenticated: false,
        currentStep: 'signup', // 'signup', 'shipping', 'payment', 'review'
        cart: {
            items: [],
            subtotal: 0,
            shipping: 0,
            total: 0,
            discount: null,
            appliedCoupons: null,
        },
        userDetails: null, // From window.userDetails
        shippingAddresses: [],
        selectedShippingAddress: null,
        savedCards: [],
        selectedCard: null,
        isLoading: false,
        isProcessingOrder: false,
    };

    // --- API LAYER ---
    const getAuthToken = () => localStorage.getItem(ATKN_KEY);
    const getCartId = () => localStorage.getItem(CART_ID_KEY);

    const checkoutApi = {
        getCart: async () => {
            const cartId = getCartId();
            if (!cartId) return { success: true, data: [] }; // No cart yet
            try {
                const response = await fetch(`${API_BASE_URL}/nonrx-cart/getcart/${cartId}`);
                if (!response.ok) throw new Error('Failed to fetch cart.');
                const result = await response.json();
                if (result.success && result.data && Array.isArray(result.data)) {
                    return { success: true, data: result.data };
                }
                return { success: false, message: 'Invalid cart data format.' };
            } catch (error) {
                console.error('getCart Error:', error);
                return { success: false, message: error.message };
            }
        },
        getAddresses: async () => {
            const atkn = getAuthToken();
            if (!atkn) return { success: false, message: 'Not authenticated.' };
            try {
                const response = await fetch(`${API_BASE_URL}/customer/getaddress`, {
                    headers: { 'Authorization': `Bearer ${atkn}` }
                });
                if (!response.ok) throw new Error('Failed to fetch addresses.');
                return await response.json();
            } catch (error) {
                console.error('getAddresses Error:', error);
                return { success: false, message: error.message };
            }
        },
        getStoredCards: async () => {
            const atkn = getAuthToken();
            if (!atkn) return { success: false, message: 'Not authenticated.' };
            try {
                const response = await fetch(`${MYACCOUNT_API_BASE_URL}/stored-cards`, {
                    headers: { 'Authorization': `Bearer ${atkn}` }
                });
                if (!response.ok) throw new Error('Failed to fetch stored cards.');
                return await response.json();
            } catch (error) {
                console.error('getStoredCards Error:', error);
                return { success: false, message: error.message };
            }
        },
        // Placeholder for authentication (login/signup) - actual implementation would be more complex
        login: async (email, password) => {
            // This is a mock. Real implementation would call an auth API and set ATKN_KEY
            console.log('Mock Login:', { email, password });
            // On successful login, set a mock token
            localStorage.setItem(ATKN_KEY, 'mock_auth_token_123');
            return { success: true, message: 'Logged in successfully.' };
        },
        signup: async (userData) => {
            // This is a mock. Real implementation would call a signup API and set ATKN_KEY
            console.log('Mock Signup:', userData);
            // On successful signup, set a mock token
            localStorage.setItem(ATKN_KEY, 'mock_auth_token_123');
            return { success: true, message: 'Signed up successfully.' };
        },
        applyCoupon: async (couponCode) => {
            try {
                const response = await fetch(`${API_BASE_URL}/coupon/apply`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ __cid: getCartId(), coupon_code: couponCode, intake_type: 4 })
                });
                if (!response.ok) throw new Error('Failed to apply coupon.');
                return await response.json();
            } catch (error) {
                console.error('applyCoupon Error:', error);
                return { success: false, message: error.message };
            }
        },
        removeCoupon: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/coupon/remove`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ __cid: getCartId() }) 
                });
                if (!response.ok) throw new Error('Failed to remove coupon.');
                return await response.json();
            } catch (error) {
                console.error('removeCoupon Error:', error);
                return { success: false, message: error.message };
            }
        }
    };

    // --- HTML & CSS INJECTION ---
    const injectStyles = () => {
        if (document.getElementById('kwilt-checkout-styles')) return;
        const style = document.createElement('style');
        style.id = 'kwilt-checkout-styles';
        style.innerHTML = `
            :root {
                --kwilt-light-gray: #F5F5F5;
                --kwilt-text-color: #333;
                --kwilt-red: #FF0000; /* Example red, adjust as needed */
                --bark: #4A2C2A; /* Example bark color, adjust as needed */
                --body-background-color: #ffffff; /* Assuming white background for content */
                --kwilt-border-color: #ccc;
            }
            body { margin: 0; font-family: sans-serif; background-color: var(--kwilt-light-gray); }
            .kwilt-checkout-container {
                max-width: 1200px;
                margin: 40px auto;
                padding: 20px;
                background: var(--body-background-color);
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                gap: 30px;
            }
            @media (max-width: 767px) {
                .kwilt-checkout-container { margin: 10px; padding: 15px; }
            }

            /* Checkout Header/Steps */
            .kwilt-checkout-header {
                display: flex;
                justify-content: space-around;
                align-items: center;
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
            }
            .kwilt-checkout-step {
                display: flex;
                flex-direction: column;
                align-items: center;
                cursor: pointer;
                opacity: 0.4;
                transition: opacity 0.3s ease;
                position: relative;
                padding: 0 10px;
            }
            .kwilt-checkout-step.active {
                opacity: 1;
            }
            .kwilt-checkout-step img {
                width: 40px;
                height: 40px;
                margin-bottom: 5px;
            }
            .kwilt-checkout-step span {
                font-size: 14px;
                font-weight: bold;
                color: var(--kwilt-text-color);
                text-align: center;
            }
            .kwilt-checkout-step:not(:last-child)::after {
                content: '';
                position: absolute;
                right: -25px; /* Adjust to position arrow */
                top: 25px;
                width: 50px; /* Length of the arrow line */
                height: 2px;
                background-color: var(--kwilt-border-color);
                transform: translateY(-50%);
                z-index: -1;
            }
            .kwilt-checkout-step:not(:last-child)::before {
                content: '';
                position: absolute;
                right: -25px; /* Start of the arrow head */
                top: 25px;
                width: 10px; /* Size of the arrow head */
                height: 10px;
                border-top: 2px solid var(--kwilt-border-color);
                border-right: 2px solid var(--kwilt-border-color);
                transform: translateY(-50%) rotate(45deg);
                z-index: -1;
            }

            /* Main Content and Summary Layout */
            .kwilt-checkout-main-content {
                display: flex;
                gap: 30px;
            }
            @media (max-width: 991px) {
                .kwilt-checkout-main-content { flex-direction: column; }
            }
            .kwilt-checkout-form-area {
                flex: 2;
            }
            .kwilt-checkout-summary-area {
                flex: 1;
            }

            /* Section Styling */
            .kwilt-checkout-section {
                margin-bottom: 30px;
                padding: 20px;
                border: 1px solid #eee;
                border-radius: 8px;
                background: var(--kwilt-light-gray);
                position: relative; /* For loader overlay */
            }
            .kwilt-checkout-section h2 {
                margin-top: 0;
                color: var(--kwilt-text-color);
                font-size: 22px;
                margin-bottom: 20px;
            }

            /* Form Elements - adapted from Webflow snippet */
            .question-column-2 { /* This class is from your snippet, adapting it */
                margin-bottom: 20px;
            }
            .question-wrapper h1.h2 { /* Adapting h1.h2 from snippet */
                font-size: 28px;
                margin-bottom: 10px;
                color: var(--kwilt-text-color);
            }
            .text-block-14 { /* Adapting text-block-14 from snippet */
                font-size: 14px;
                color: #666;
                margin-bottom: 20px;
            }
            .subquestion-wrapper { /* Adapting subquestion-wrapper from snippet */
                margin-bottom: 10px;
            }
            .text-block-12 { /* Adapting text-block-12 from snippet */
                font-weight: bold;
                font-size: 14px;
                color: var(--kwilt-text-color);
            }
            .text-block-13 { /* Adapting text-block-13 from snippet */
                font-size: 12px;
                color: #888;
                margin-top: 5px;
            }
            .kwilt-flex-row {
                display: flex;
                gap: 15px;
                margin-bottom: 15px;
            }
            .kwilt-flex-row > div {
                flex: 1;
            }
            .input-label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
                color: var(--kwilt-text-color);
                font-size: 14px;
            }
            .kwilt-input, .kwilt-select {
                width: 100%;
                padding: 10px;
                border: 1px solid var(--kwilt-border-color);
                border-radius: 4px;
                box-sizing: border-box;
                font-size: 16px;
                background-color: white;
            }
            .kwilt-input[type="checkbox"] {
                width: auto;
                margin-right: 10px;
            }
            .kwilt-password-wrapper {
                position: relative;
            }
            .kwilt-toggle-password {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                cursor: pointer;
                padding: 0;
            }
            .kwilt-toggle-password svg {
                vertical-align: middle;
            }
            .div-block-135 { /* Adapting div-block-135 from snippet */
                margin-top: 20px;
            }
            .div-block-91 { /* Adapting div-block-91 from snippet */
                display: flex;
                align-items: center;
            }
            .div-block-103 { /* Adapting div-block-103 from snippet */
                margin-top: 30px;
            }
            .kwilt-button {
                background-color: var(--bark);
                color: white;
                padding: 12px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                transition: background-color 0.3s ease;
            }
            .kwilt-button:hover:not(:disabled) {
                background-color: #6a4a48; /* Darker shade of bark */
            }
            .kwilt-button:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }

            /* Loaders */
            .kwilt-loader-overlay {
                position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.7); display: flex; justify-content: center; align-items: center; z-index: 10; border-radius: 8px;
            }
            .kwilt-loader {
                display: block; width: 48px; height: 48px; border: 5px solid var(--bark); border-bottom-color: transparent; border-radius: 50%; animation: kwilt-spin 1s linear infinite;
            }
            @keyframes kwilt-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .kwilt-spinner-small { display: inline-block; width: 16px; height: 16px; border: 2px solid currentColor; border-bottom-color: transparent; border-radius: 50%; animation: kwilt-spin 1s linear infinite; vertical-align: middle; }

            /* Cart Summary Styles - adapted from cart.js */
            .kwilt-cart-summary-section {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin-top: 0; /* Adjusted for flex layout */
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            }
            .kwilt-cart-item { display: flex; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee; align-items: flex-start; position: relative; }
            .kwilt-cart-item-img { width: 80px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 15px; flex-shrink: 0; background:var(--kwilt-light-gray); }
            .kwilt-cart-item-details { flex-grow: 1; display: flex; flex-direction: column; }
            .kwilt-cart-item-name { font-weight: bold; margin: 0 0 5px; font-size: 15px; }
            .kwilt-cart-item-plan, .kwilt-cart-item-supply { font-size: 13px; color: #666; margin: 2px 0; }
            .kwilt-cart-item-price { font-weight: bold; font-size: 15px; margin-top: 5px; }
            .kwilt-quantity-selector { display: flex; align-items: center; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px; }
            .kwilt-quantity-btn { background: none; border: none; cursor: pointer; padding: 3px 8px; font-size: 16px; }
            .kwilt-quantity-value { padding: 0 8px; font-size: 14px; }
            .kwilt-cart-item-remove { cursor: pointer; font-size: 18px; line-height: 1; position: absolute; top: 0; right: 0; color: #999; }

            .kwilt-discount-section {
                display: flex;
                margin-top: 20px;
                margin-bottom: 15px;
                background: var(--kwilt-light-gray);
                padding: 10px;
                border-radius: 8px;
                border: 1px solid #ddd;
            }
            .kwilt-discount-input {
                flex-grow: 1;
                border: none;
                outline: none;
                border-radius: 4px 0 0 4px;
                padding: 10px;
                background: transparent;
            }
            .kwilt-discount-btn {
                padding: 0 15px;
                border-radius: 0 4px 4px 0;
                cursor: pointer;
                background: var(--bark);
                color: white;
                border: none;
                font-weight: bold;
            }
            .kwilt-summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 15px; }
            .kwilt-summary-total { font-weight: bold; font-size: 18px; margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px; }
            .kwilt-applied-coupon { display: flex; justify-content: space-between; align-items: center; background: var(--kwilt-light-gray); padding: 10px; border-radius: 8px; margin-top: 10px; font-weight: bold; }
            .kwilt-applied-coupon-remove { cursor: pointer; font-size: 18px; margin-left: 10px; background: none; border: none; color: var(--kwilt-text-color); }
            .kwilt-checkout-place-order-btn {
                display: block; width: 100%; background-color: var(--kwilt-red); color: white; text-align: center; padding: 15px; border: none; border-radius: 4px; font-size: 18px; font-weight: bold; cursor: pointer; margin-top: 20px;
            }

            /* Address and Card Display */
            .kwilt-address-display, .kwilt-card-display {
                background: white;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #ddd;
                margin-bottom: 15px;
            }
            .kwilt-address-display p, .kwilt-card-display p {
                margin: 5px 0;
                font-size: 14px;
            }
        `;
        document.head.appendChild(style);
    };

    const createCheckoutHTML = () => {
        if (document.getElementById('kwilt-checkout-app')) return;
        const appContainer = document.createElement('div');
        appContainer.id = 'kwilt-checkout-app';
        appContainer.className = 'kwilt-checkout-container';
        document.body.appendChild(appContainer); 
    };

    // --- RENDER FUNCTIONS ---
    const render = () => {
        const appContainer = document.getElementById('kwilt-checkout-app');
        if (!appContainer) return;

        appContainer.innerHTML = `
            <div class="kwilt-checkout-header">
                <div class="kwilt-checkout-step ${checkoutState.currentStep === 'signup' ? 'active' : ''}" data-step="signup">
                    <img src="/home/ganapathi/Desktop/kwilt_webflow/checkout/signup_active.png" alt="Sign Up">
                    <span>Sign Up / Login</span>
                </div>
                <div class="kwilt-checkout-step ${checkoutState.currentStep === 'shipping' ? 'active' : ''}" data-step="shipping">
                    <img src="/home/ganapathi/Desktop/kwilt_webflow/checkout/shipping_active.png" alt="Shipping">
                    <span>Shipping</span>
                </div>
                <div class="kwilt-checkout-step ${checkoutState.currentStep === 'payment' ? 'active' : ''}" data-step="payment">
                    <img src="/home/ganapathi/Desktop/kwilt_webflow/checkout/payment_active.png" alt="Payment">
                    <span>Payment</span>
                </div>
            </div>
            <div class="kwilt-checkout-main-content">
                <div class="kwilt-checkout-form-area" id="kwilt-checkout-content">
                    ${renderContentByStep()}
                </div>
                <div class="kwilt-checkout-summary-area" id="kwilt-checkout-cart-summary">
                    ${renderCartSummary()}
                </div>
            </div>
        `;
        attachEventListeners();
    };

    const renderContentByStep = () => {
        if (checkoutState.isLoading) {
            return `<div class="kwilt-loader-overlay"><div class="kwilt-loader"></div></div>`;
        }
        switch (checkoutState.currentStep) {
            case 'signup':
                return renderAuthSection();
            case 'shipping':
                return renderShippingSection();
            case 'payment':
                return renderPaymentSection();
            default:
                return `<p>Unknown checkout step.</p>`;
        }
    };

    const renderAuthSection = () => {
        return `
            <div class="kwilt-checkout-section" id="kwilt-auth-section">
                <div class="question-column-2 w-container">
                    <div class="question-wrapper">
                        <h1 class="h2">Your information</h1>
                        <div class="text-block-14">If you are signing up someone besides yourself, input their details and not your own.</div>
                    </div>
                    <form id="kwilt-auth-form">
                        <div class="subquestion-wrapper">
                            <div class="text-block-12">LEGAL NAME</div>
                            <div class="text-block-13">*Your name must match the ID you present at each lab visit.</div>
                        </div>
                        <div class="kwilt-flex-row">
                            <div>
                                <input type="text" id="first_name" name="firstname" placeholder="First name" required class="kwilt-input" value="${checkoutState.userDetails?.firstname || ''}">
                            </div>
                            <div>
                                <input type="text" id="last_name" name="lastname" placeholder="Last name" required class="kwilt-input" value="${checkoutState.userDetails?.lastname || ''}">
                            </div>
                        </div>
                        <div class="kwilt-flex-row">
                            <div>
                                <div class="input-label">Email</div>
                                <input type="email" id="email" name="email" placeholder="Email" required class="kwilt-input" value="${checkoutState.userDetails?.email || ''}">
                            </div>
                            <div>
                                <div class="input-label">Date of Birth</div>
                                <input type="text" id="dob" name="dob" placeholder="MM/DD/YYYY" required data-mask="99/99/9999" class="kwilt-input" inputmode="text" value="${checkoutState.userDetails?.dob || ''}">
                            </div>
                        </div>
                        <div class="kwilt-flex-row">
                            <div>
                                <div class="input-label">Password</div>
                                <div class="kwilt-password-wrapper">
                                    <input type="password" id="password" name="password" placeholder="Password" required class="kwilt-input kwilt-password-input">
                                    <button type="button" class="kwilt-toggle-password" data-target="password" aria-label="Toggle password visibility">
                                        <svg class="icon-eye" xmlns="http://www.w3.org/2000/svg" fill="#000000" height="20px" width="20px" viewBox="0 0 612 612"><g><g><path d="M609.608,315.426c3.19-5.874,3.19-12.979,0-18.853c-58.464-107.643-172.5-180.72-303.607-180.72 S60.857,188.931,2.393,296.573c-3.19,5.874-3.19,12.979,0,18.853C60.858,423.069,174.892,496.147,306,496.147 S551.143,423.069,609.608,315.426z M306,451.855c-80.554,0-145.855-65.302-145.855-145.855S225.446,160.144,306,160.144 S451.856,225.446,451.856,306S386.554,451.855,306,451.855z"></path><path d="M306,231.67c-6.136,0-12.095,0.749-17.798,2.15c5.841,6.76,9.383,15.563,9.383,25.198c0,21.3-17.267,38.568-38.568,38.568 c-9.635,0-18.438-3.541-25.198-9.383c-1.401,5.703-2.15,11.662-2.15,17.798c0,41.052,33.279,74.33,74.33,74.33 s74.33-33.279,74.33-74.33S347.052,231.67,306,231.67z"></path></g></g></svg>
                                        <svg class="icon-eye-off" style="display:none;" xmlns="http://www.w3.org/2000/svg" fill="#000000" height="20px" width="20px" viewBox="0 0 1200 1200" enable-background="new 0 0 1200 1200"><path d="M669.727,273.516c-22.891-2.476-46.15-3.895-69.727-4.248c-103.025,0.457-209.823,25.517-310.913,73.536 c-75.058,37.122-148.173,89.529-211.67,154.174C46.232,529.978,6.431,577.76,0,628.74c0.76,44.162,48.153,98.67,77.417,131.764 c59.543,62.106,130.754,113.013,211.67,154.174c2.75,1.335,5.51,2.654,8.276,3.955l-75.072,131.102l102.005,60.286l551.416-960.033 l-98.186-60.008L669.727,273.516z M902.563,338.995l-74.927,129.857c34.47,44.782,54.932,100.006,54.932,159.888 c0,149.257-126.522,270.264-282.642,270.264c-6.749,0-13.29-0.728-19.922-1.172l-49.585,85.84c22.868,2.449,45.99,4.233,69.58,4.541 c103.123-0.463,209.861-25.812,310.84-73.535c75.058-37.122,148.246-89.529,211.743-154.174 c31.186-32.999,70.985-80.782,77.417-131.764c-0.76-44.161-48.153-98.669-77.417-131.763 c-59.543-62.106-130.827-113.013-211.743-154.175C908.108,341.478,905.312,340.287,902.563,338.995L902.563,338.995z M599.927,358.478c6.846,0,13.638,0.274,20.361,0.732l-58.081,100.561c-81.514,16.526-142.676,85.88-142.676,168.897 c0,20.854,3.841,40.819,10.913,59.325c0.008,0.021-0.008,0.053,0,0.074l-58.228,100.854 c-34.551-44.823-54.932-100.229-54.932-160.182C317.285,479.484,443.808,358.477,599.927,358.478L599.927,358.478z M768.896,570.513 L638.013,797.271c81.076-16.837,141.797-85.875,141.797-168.603C779.81,608.194,775.724,588.729,768.896,570.513L768.896,570.513z"></path></svg>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div class="input-label">Confirm&nbsp;Password</div>
                                <div class="kwilt-password-wrapper">
                                    <input type="password" id="confirm_password" name="confirm_password" placeholder="Confirm Password" required class="kwilt-input kwilt-password-input">
                                    <button type="button" class="kwilt-toggle-password" data-target="confirm_password" aria-label="Toggle confirm password visibility">
                                        <svg class="icon-eye" xmlns="http://www.w3.org/2000/svg" fill="#000000" height="20px" width="20px" viewBox="0 0 612 612"><g><g><path d="M609.608,315.426c3.19-5.874,3.19-12.979,0-18.853c-58.464-107.643-172.5-180.72-303.607-180.72 S60.857,188.931,2.393,296.573c-3.19,5.874-3.19,12.979,0,18.853C60.858,423.069,174.892,496.147,306,496.147 S551.143,423.069,609.608,315.426z M306,451.855c-80.554,0-145.855-65.302-145.855-145.855S225.446,160.144,306,160.144 S451.856,225.446,451.856,306S386.554,451.855,306,451.855z"></path><path d="M306,231.67c-6.136,0-12.095,0.749-17.798,2.15c5.841,6.76,9.383,15.563,9.383,25.198c0,21.3-17.267,38.568-38.568,38.568 c-9.635,0-18.438-3.541-25.198-9.383c-1.401,5.703-2.15,11.662-2.15,17.798c0,41.052,33.279,74.33,74.33,74.33 s74.33-33.279,74.33-74.33S347.052,231.67,306,231.67z"></path></g></g></svg>
                                        <svg class="icon-eye-off" style="display:none;" xmlns="http://www.w3.org/2000/svg" fill="#000000" height="20px" width="20px" viewBox="0 0 1200 1200" enable-background="new 0 0 1200 1200"><path d="M669.727,273.516c-22.891-2.476-46.15-3.895-69.727-4.248c-103.025,0.457-209.823,25.517-310.913,73.536 c-75.058,37.122-148.173,89.529-211.67,154.174C46.232,529.978,6.431,577.76,0,628.74c0.76,44.162,48.153,98.67,77.417,131.764 c59.543,62.106,130.754,113.013,211.67,154.174c2.75,1.335,5.51,2.654,8.276,3.955l-75.072,131.102l102.005,60.286l551.416-960.033 l-98.186-60.008L669.727,273.516z M902.563,338.995l-74.927,129.857c34.47,44.782,54.932,100.006,54.932,159.888 c0,149.257-126.522,270.264-282.642,270.264c-6.749,0-13.29-0.728-19.922-1.172l-49.585,85.84c22.868,2.449,45.99,4.233,69.58,4.541 c103.123-0.463,209.861-25.812,310.84-73.535c75.058-37.122,148.246-89.529,211.743-154.174 c31.186-32.999,70.985-80.782,77.417-131.764c-0.76-44.161-48.153-98.669-77.417-131.763 c-59.543-62.106-130.827-113.013-211.743-154.175C908.108,341.478,905.312,340.287,902.563,338.995L902.563,338.995z M599.927,358.478c6.846,0,13.638,0.274,20.361,0.732l-58.081,100.561c-81.514,16.526-142.676,85.88-142.676,168.897 c0,20.854,3.841,40.819,10.913,59.325c0.008,0.021-0.008,0.053,0,0.074l-58.228,100.854 c-34.551-44.823-54.932-100.229-54.932-160.182C317.285,479.484,443.808,358.477,599.927,358.478L599.927,358.478z M768.896,570.513 L638.013,797.271c81.076-16.837,141.797-85.875,141.797-168.603C779.81,608.194,775.724,588.729,768.896,570.513L768.896,570.513z"></path></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="kwilt-flex-row">
                            <div>
                                <div class="input-label">Biological Sex</div>
                                <select name="gender" required class="kwilt-input kwilt-select">
                                    <option value="" disabled selected hidden>Select an option</option>
                                    <option value="Male" ${checkoutState.userDetails?.biological_data?.gender === 'Male' ? 'selected' : ''}>Male</option>
                                    <option value="Female" ${checkoutState.userDetails?.biological_data?.gender === 'Female' ? 'selected' : ''}>Female</option>
                                </select>
                            </div>
                            <div></div>
                        </div>
                        <div class="div-block-135">
                            <div class="div-block-91 intake-input-wrapper">
                                <input type="checkbox" name="tc" required class="kwilt-input">
                                <div class="text-block-13 input-label">I agree to KWILT’s Terms oF Service&nbsp;and&nbsp;Privacy Policy.</div>
                            </div>
                        </div>
                        <div class="div-block-103">
                            <button type="submit" class="kwilt-button" id="kwilt-signup-btn">Sign Up</button>
                            <button type="button" class="kwilt-button" id="kwilt-login-btn" style="margin-left: 10px;">Login</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    };

    const renderShippingSection = () => {
        const defaultShipping = checkoutState.selectedShippingAddress || checkoutState.shippingAddresses[0] || checkoutState.userDetails?.default_shipping;
        return `
            <div class="kwilt-checkout-section" id="kwilt-shipping-section">
                <h2>Shipping Information</h2>
                ${defaultShipping ? `
                    <div class="kwilt-address-display">
                        <p><strong>${defaultShipping.firstname} ${defaultShipping.lastname}</strong></p>
                        <p>${defaultShipping.street.join(', ')}</p>
                        <p>${defaultShipping.city}, ${defaultShipping.region} ${defaultShipping.postcode}</p>
                        <p>${defaultShipping.country_id}</p>
                        <p>Phone: ${defaultShipping.telephone}</p>
                        <button class="kwilt-button kwilt-edit-address-btn" data-address-id="${defaultShipping.id || 'default'}">Edit Address</button>
                    </div>
                ` : `<p>No shipping address found. Please add one.</p>`}
                <button class="kwilt-button" id="kwilt-add-new-address-btn" style="margin-top: 15px;">Add New Address</button>
                ${checkoutState.shippingAddresses.length > 1 ? `
                    <button class="kwilt-button" id="kwilt-select-address-btn" style="margin-top: 15px; margin-left: 10px;">Select from Saved</button>
                ` : ''}
                <button class="kwilt-button" id="kwilt-proceed-to-payment" style="margin-top: 20px;">Proceed to Payment</button>
            </div>
        `;
    };

    const renderPaymentSection = () => {
        const defaultCard = checkoutState.selectedCard || checkoutState.savedCards[0];
        return `
            <div class="kwilt-checkout-section" id="kwilt-payment-section">
                <h2>Payment Information</h2>
                ${defaultCard ? `
                    <div class="kwilt-card-display">
                        <p><strong>Card Type:</strong> ${defaultCard.cc_type}</p>
                        <p><strong>Last 4 Digits:</strong> ${defaultCard.cc_last4}</p>
                        ${defaultCard.cc_exp_month && defaultCard.cc_exp_year ? `<p><strong>Expires:</strong> ${defaultCard.cc_exp_month}/${defaultCard.cc_exp_year}</p>` : ''}
                        <button class="kwilt-button kwilt-edit-card-btn" data-card-id="${defaultCard.cc_last4}">Edit Card</button>
                    </div>
                ` : `<p>No saved cards found. Please add one.</p>`}
                <button class="kwilt-button" id="kwilt-add-new-card-btn" style="margin-top: 15px;">Add New Card</button>
                ${checkoutState.savedCards.length > 1 ? `
                    <button class="kwilt-button" id="kwilt-select-card-btn" style="margin-top: 15px; margin-left: 10px;">Select from Saved</button>
                ` : ''}
                <button class="kwilt-button kwilt-checkout-place-order-btn" id="kwilt-place-order-btn" style="margin-top: 20px;" ${checkoutState.isProcessingOrder ? 'disabled' : ''}>
                    ${checkoutState.isProcessingOrder ? '<span class="kwilt-spinner-small"></span> Placing Order...' : 'Place Order'}
                </button>
            </div>
        `;
    };

    const renderCartSummary = () => {
        const cart = checkoutState.cart;
        return `
            <div class="kwilt-cart-summary-section">
                <h2>Order Summary</h2>
                <div id="kwilt-checkout-cart-items">
                    ${cart.items.length === 0 ? '<p>Your cart is empty.</p>' :
                        cart.items.map(item => `
                            <div class="kwilt-cart-item" data-item-id="${item.item_id}">
                                <img src="${item.thumbnail}" alt="${item.name}" class="kwilt-cart-item-img">
                                <div class="kwilt-cart-item-details">
                                    <h4 class="kwilt-cart-item-name">${item.name}</h4>
                                    <p class="kwilt-cart-item-plan">${item.plan_name} ${item.monthly_price ? `Subscription - $${parseFloat(item.monthly_price).toFixed(2)}/mo` : ''}</p>
                                    <p class="kwilt-cart-item-supply">Qty: ${item.qty} @ $${parseFloat(item.price).toFixed(2)} each</p>
                                    <span class="kwilt-cart-item-price">$${parseFloat(item.row_total).toFixed(2)}</span>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
                ${cart.discount ? `
                    <div class="kwilt-applied-coupon">
                        <span>Coupon: ${cart.discount.code}</span>
                        <button class="kwilt-applied-coupon-remove" data-action="remove-coupon">&times;</button>
                    </div>` : `
                    <div class="kwilt-discount-section">
                        <input type="text" class="kwilt-discount-input" placeholder="Discount or Gift Card Code" id="kwilt-coupon-input">
                        <button class="kwilt-discount-btn" data-action="apply-discount">Apply</button>
                    </div>`
                }
                <div class="kwilt-summary-row"><span>Subtotal:</span><span>$${cart.subtotal.toFixed(2)}</span></div>
                <div class="kwilt-summary-row"><span>Shipping:</span><span>${cart.shipping === 0 ? 'FREE' : '$' + cart.shipping.toFixed(2)}</span></div>
                ${cart.discount ? `<div class="kwilt-summary-row"><span>Discount (${cart.discount.code}):</span><span>-$${cart.discount.amount.toFixed(2)}</span></div>` : ''}
                <div class="kwilt-summary-row kwilt-summary-total"><span>Total:</span><span>$${cart.total.toFixed(2)}</span></div>
            </div>
        `;
    };

    // --- STATE UPDATES ---
    const updateStateFromCartApi = (apiData) => {
        let items = [];
        let cartTotal = {};
        let appliedCoupons = null;
        let creditCard = null;
        let shippingAddress = null;
        let billingAddress = null;
        let contact = null;

        for (const obj of apiData) {
            if (obj.items) items = obj.items;
            if (obj.cart_total) cartTotal = obj.cart_total;
            if (obj.applied_coupons) appliedCoupons = obj.applied_coupons;
            if (obj.credit_card) creditCard = obj.credit_card;
            if (obj.shipping_address) shippingAddress = obj.shipping_address;
            if (obj.billing_address) billingAddress = obj.billing_address;
            if (obj.contact) contact = obj.contact;
        }

        checkoutState.cart.items = items;
        checkoutState.cart.subtotal = parseFloat(cartTotal.subtotal || 0);
        checkoutState.cart.total = parseFloat(cartTotal.grand_total || 0);
        checkoutState.cart.shipping = parseFloat(cartTotal.shipping_amount || 0);
        checkoutState.cart.appliedCoupons = appliedCoupons;

        if (appliedCoupons) {
            checkoutState.cart.discount = { code: appliedCoupons, amount: parseFloat(cartTotal.discount_amount || 0) };
        } else {
            checkoutState.cart.discount = null;
        }

        // If userDetails from window is not set, try to get from cart contact
        if (!checkoutState.userDetails && contact) {
            checkoutState.userDetails = {
                email: contact.email,
                firstname: contact.customer_firstname,
                lastname: contact.customer_lastname,
                // Other fields like gender, dob, etc., would need to come from a user profile API
            };
        }

        // Set selected shipping address if available from cart
        if (shippingAddress) {
            checkoutState.selectedShippingAddress = {
                ...shippingAddress,
                id: 'cart_shipping', // Assign a temporary ID
                country_id: shippingAddress.country, // Align with getAddress format
                region: shippingAddress.region,
            };
        }

        // Set selected card if available from cart
        if (creditCard) {
            checkoutState.selectedCard = {
                cc_last4: creditCard.cc_last4,
                cc_type: creditCard.cc_type,
                // Expiry month/year not in sample payload, would need to be fetched or inferred
            };
        }
    };

    const updateStateFromAddressesApi = (apiData) => {
        if (apiData.success && Array.isArray(apiData.data)) {
            checkoutState.shippingAddresses = apiData.data;
            if (!checkoutState.selectedShippingAddress && apiData.data.length > 0) {
                checkoutState.selectedShippingAddress = apiData.data.find(addr => addr.default_shipping) || apiData.data[0];
            }
        } else {
            checkoutState.shippingAddresses = [];
            checkoutState.selectedShippingAddress = null;
        }
    };

    const updateStateFromCardsApi = (apiData) => {
        if (apiData.success && Array.isArray(apiData.data)) {
            checkoutState.savedCards = apiData.data;
            if (!checkoutState.selectedCard && apiData.data.length > 0) {
                checkoutState.selectedCard = apiData.data[0]; // Assuming first card is default
            }
        } else {
            checkoutState.savedCards = [];
            checkoutState.selectedCard = null;
        }
    };

    // --- EVENT HANDLERS ---
    const attachEventListeners = () => {
        const appContainer = document.getElementById('kwilt-checkout-app');
        if (!appContainer) return;

        // Step navigation
        appContainer.querySelectorAll('.kwilt-checkout-step').forEach(stepEl => {
            stepEl.onclick = (e) => {
                const step = e.currentTarget.dataset.step;
                if (step) {
                    goToStep(step);
                }
            };
        });

        // Auth Section
        const authForm = document.getElementById('kwilt-auth-form');
        if (authForm) {
            authForm.onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(authForm);
                const data = Object.fromEntries(formData.entries());

                if (data.password !== data.confirm_password) {
                    alert('Passwords do not match!');
                    return;
                }

                checkoutState.isLoading = true;
                render();
                const result = await checkoutApi.signup(data); // Assuming signup for form submission
                if (result.success) {
                    checkoutState.isAuthenticated = true;
                    await loadAllCheckoutData();
                    goToStep('shipping');
                } else {
                    alert(result.message || 'Signup failed.');
                }
                checkoutState.isLoading = false;
                render();
            };

            document.getElementById('kwilt-login-btn').onclick = async () => {
                const email = authForm.querySelector('#email').value;
                const password = authForm.querySelector('#password').value;
                if (!email || !password) {
                    alert('Please enter email and password for login.');
                    return;
                }

                checkoutState.isLoading = true;
                render();
                const result = await checkoutApi.login(email, password);
                if (result.success) {
                    checkoutState.isAuthenticated = true;
                    await loadAllCheckoutData();
                    goToStep('shipping');
                } else {
                    alert(result.message || 'Login failed.');
                }
                checkoutState.isLoading = false;
                render();
            };

            // Password toggle
            appContainer.querySelectorAll('.kwilt-toggle-password').forEach(button => {
                button.onclick = () => {
                    const targetId = button.dataset.target;
                    const targetInput = document.getElementById(targetId);
                    const iconEye = button.querySelector('.icon-eye');
                    const iconEyeOff = button.querySelector('.icon-eye-off');

                    if (targetInput.type === 'password') {
                        targetInput.type = 'text';
                        iconEye.style.display = 'none';
                        iconEyeOff.style.display = 'inline-block';
                    } else {
                        targetInput.type = 'password';
                        iconEye.style.display = 'inline-block';
                        iconEyeOff.style.display = 'none';
                    }
                };
            });
        }

        // Shipping Section
        const proceedToPaymentBtn = document.getElementById('kwilt-proceed-to-payment');
        if (proceedToPaymentBtn) {
            proceedToPaymentBtn.onclick = () => goToStep('payment');
        }
        // Add/Edit/Select Address buttons would have their own handlers here
        // For now, they just move to the next step.

        // Payment Section
        const placeOrderBtn = document.getElementById('kwilt-place-order-btn');
        if (placeOrderBtn) {
            placeOrderBtn.onclick = async () => {
                if (!checkoutState.selectedShippingAddress || !checkoutState.selectedCard) {
                    alert('Please select both shipping address and payment method.');
                    return;
                }
                checkoutState.isProcessingOrder = true;
                render();
                // Mock order placement
                await new Promise(resolve => setTimeout(resolve, 2000));
                alert('Order Placed Successfully!');
                checkoutState.isProcessingOrder = false;
                // Optionally clear cart, redirect, etc.
                render();
            };
        }
        // Add/Edit/Select Card buttons would have their own handlers here

        // Coupon Section
        const applyDiscountBtn = appContainer.querySelector('.kwilt-discount-btn[data-action="apply-discount"]');
        if (applyDiscountBtn) {
            applyDiscountBtn.onclick = async () => {
                const couponInput = document.getElementById('kwilt-coupon-input');
                const couponCode = couponInput.value.trim();
                if (couponCode) {
                    applyDiscountBtn.disabled = true;
                    couponInput.disabled = true;
                    const result = await checkoutApi.applyCoupon(couponCode);
                    if (result.success) {
                        await refreshCartData();
                    } else {
                        alert(result.message || 'Failed to apply coupon.');
                    }
                    applyDiscountBtn.disabled = false;
                    couponInput.disabled = false;
                    render();
                }
            };
        }

        const removeCouponBtn = appContainer.querySelector('.kwilt-applied-coupon-remove[data-action="remove-coupon"]');
        if (removeCouponBtn) {
            removeCouponBtn.onclick = async () => {
                removeCouponBtn.disabled = true;
                const result = await checkoutApi.removeCoupon();
                if (!result.success) alert(result.message || 'Failed to remove coupon.');
                await refreshCartData();
                removeCouponBtn.disabled = false;
                render();
            };
        }
    };

    const goToStep = (step) => {
        checkoutState.currentStep = step;
        render();
    };

    const refreshCartData = async () => {
        checkoutState.isLoading = true;
        render();
        const cartResult = await checkoutApi.getCart();
        if (cartResult.success) {
            updateStateFromCartApi(cartResult.data);
        } else {
            alert('Failed to refresh cart data.');
        }
        checkoutState.isLoading = false;
        render();
    };

    const loadAllCheckoutData = async () => {
        checkoutState.isLoading = true;
        render();

        // Load Cart Data
        const cartResult = await checkoutApi.getCart();
        if (cartResult.success) {
            updateStateFromCartApi(cartResult.data);
        } else {
            alert('Failed to load cart data.');
        }

        // Load User Details from window.userDetails if available
        if (window.userDetails) {
            checkoutState.userDetails = window.userDetails;
            // Attempt to set default shipping if not already set from cart
            if (!checkoutState.selectedShippingAddress && window.userDetails.default_shipping) {
                checkoutState.selectedShippingAddress = {
                    ...window.userDetails.default_shipping,
                    id: 'user_default_shipping',
                };
            }
        }

        // Load Addresses (only if authenticated)
        if (checkoutState.isAuthenticated) {
            const addressResult = await checkoutApi.getAddresses();
            if (addressResult.success) {
                updateStateFromAddressesApi(addressResult);
            } else {
                alert('Failed to load shipping addresses.');
            }

            // Load Stored Cards (only if authenticated)
            const cardsResult = await checkoutApi.getStoredCards();
            if (cardsResult.success) {
                updateStateFromCardsApi(cardsResult);
            } else {
                alert('Failed to load stored cards.');
            }
        }

        checkoutState.isLoading = false;
        render();
    };

    // --- INITIALIZATION ---
    const init = async () => {
        injectStyles();
        createCheckoutHTML();

        // Check authentication status
        if (getAuthToken()) {
            checkoutState.isAuthenticated = true;
            checkoutState.currentStep = 'shipping'; // Start at shipping if logged in
            await loadAllCheckoutData();
        } else {
            checkoutState.isAuthenticated = false;
            checkoutState.currentStep = 'signup'; // Start at signup if not logged in
            // Still load cart data even if not authenticated
            await refreshCartData();
        }
        render();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();