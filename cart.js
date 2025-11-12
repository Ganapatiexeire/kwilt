(function () {
    // --- API CONFIGURATION ---
    const API_BASE_URL = 'https://kwilt-order-396730550724.us-central1.run.app';
    const CART_ID_KEY = '__cid';

    // --- STATE MANAGEMENT ---
    let cartState = {
        items: [],
        recommended: [],
        subtotal: 0,
        shipping: 0,
        total: 0,
        discount: null,
        isOpened: false,
        isLoading: false,
    };

    // --- API LAYER ---
    const getCartId = () => localStorage.getItem(CART_ID_KEY);
    const setCartId = (cartId) => localStorage.setItem(CART_ID_KEY, cartId);
    const getAuthToken = () => localStorage.getItem('atkn');

    const getAuthHeaders = () => {
        const authToken = getAuthToken();
        if (authToken) {
            return { 'Authorization': `Bearer ${authToken}` };
        }
        return {};
    };

    const cartApi = {
        getCart: async () => {
            const cartId = getCartId();
            const authToken = getAuthToken();
            let url = `${API_BASE_URL}/nonrx-cart/getcart`;
            let headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };

            if (authToken) {
                // If authenticated, cartId is passed via Authorization header (if needed by backend)
                // For getcart, if auth token is present, the backend might infer the cart
                // or expect cartId in headers. Assuming it's handled by auth token for now.
            } else if (cartId) {
                url = `${url}/${cartId}`;
            } else {
                return { success: true, data: { items: [], cart_total: {} } }; // No cart yet and not logged in
            }

            try {
                const response = await fetch(url, { headers: headers });
                if (!response.ok) throw new Error('Failed to fetch cart.');
                const result = await response.json();

                // Handle the specific case where API returns success: false but data is an empty array (empty cart)
                if (!result.success && Array.isArray(result.data) && result.data.length === 0) {
                    return { success: true, data: { items: [], cart_total: {} } };
                }

                if (result.success && result.data) {
                    let items = [];
                    let cartTotal = {};
                    let appliedCoupons = null;

                    if (Array.isArray(result.data)) {
                        for (const obj of result.data) {
                            if (obj.items) {
                                items = obj.items;
                            }
                            if (obj.cart_total) {
                                cartTotal = obj.cart_total;
                            }
                            if (obj.applied_coupons) {
                                appliedCoupons = obj.applied_coupons;
                            }
                        }
                    } else if (typeof result.data === 'object' && result.data !== null) {
                        items = result.data.items || [];
                        cartTotal = result.data.cart_total || {};
                        appliedCoupons = result.data.applied_coupons || null;
                    } else {
                        return { success: false, message: 'Invalid cart data format: data is not an array or object.' };
                    }

                    return { success: true, data: { items: items, cart_total: cartTotal, applied_coupons: appliedCoupons } };
                }
                return { success: false, message: result.message || 'Failed to fetch cart or invalid response structure.' };
            } catch (error) {
                console.error('getCart Error:', error);
                return { success: false, message: error.message };
            }
        },
        updateItem: async (itemId, quantity) => {
            const authToken = getAuthToken();
            let bodyData = { __iid: parseInt(itemId), __q: quantity };
            if (!authToken) {
                bodyData.__cid = getCartId();
            }
            try {
                const response = await fetch(`${API_BASE_URL}/nonrx-cart/updateitem`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify(bodyData)
                });
                if (!response.ok) throw new Error('Failed to update item.');
                return await response.json();
            } catch (error) {
                console.error('updateItem Error:', error);
                return { success: false, message: error.message };
            }
        },
        deleteItem: async (itemId) => {
            const authToken = getAuthToken();
            let bodyData = { __iid: parseInt(itemId) };
            if (!authToken) {
                bodyData.__cid = getCartId();
            }
            try {
                const response = await fetch(`${API_BASE_URL}/nonrx-cart/deleteitem`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify(bodyData)
                });
                if (!response.ok) throw new Error('Failed to delete item.');
                return await response.json();
            } catch (error) {
                console.error('deleteItem Error:', error);
                return { success: false, message: error.message };
            }
        },
        addItem: async (payload) => { // Assuming simple product add for recommended
            const authToken = getAuthToken();
            let bodyData = { ...payload, __q: 1 };
            if (!authToken) {
                bodyData.__cid = getCartId();
            }
            try {
                const response = await fetch(`${API_BASE_URL}/nonrx-cart/addItemToCart`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify(bodyData)
                });
                if (!response.ok) throw new Error('Failed to add item.');
                return await response.json();
            } catch (error) {
                console.error('addItem Error:', error);
                return { success: false, message: error.message };
            }
        },
        applyCoupon: async (couponCode) => {
            const authToken = getAuthToken();
            let bodyData = { coupon_code: couponCode, intake_type: 4 };
            if (!authToken) {
                bodyData.__cid = getCartId();
            }
            try {
                const response = await fetch(`${API_BASE_URL}/coupon/apply`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify(bodyData)
                });
                if (!response.ok) throw new Error('Failed to apply coupon.');
                return await response.json();
            } catch (error) {
                console.error('applyCoupon Error:', error);
                return { success: false, message: error.message };
            }
        },
        getRecommendedProducts: async () => {
            try {
                const response = await fetch('https://kwilt-intake-396730550724.us-central1.run.app/products/recommended', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });
                if (!response.ok) throw new Error('Failed to fetch recommended products.');
                return await response.json();
            } catch (error) {
                console.error('getRecommendedProducts Error:', error);
                return { success: false, message: error.message };
            }
        },
        removeCoupon: async () => {
            const authToken = getAuthToken();
            let bodyData = { coupon_code: cartState.discount ? cartState.discount.code : null };
            if (!authToken) {
                bodyData.__cid = getCartId();
            }
            try {
                const response = await fetch(`${API_BASE_URL}/coupon/remove`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify(bodyData)
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
        if (document.getElementById('kwilt-cart-styles')) return;
        const style = document.createElement('style');
        style.id = 'kwilt-cart-styles';
        style.innerHTML = `
            :root {
                --kwilt-light-gray: #F5F5F5;
                --kwilt-text-color: #452D0F;
            }
            .kwilt-cart-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: rgba(0, 0, 0, 0.5); z-index: 9998;
                opacity: 0; visibility: hidden; transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            .kwilt-cart-sidebar {
                position: fixed; top: 0; right: -40%; width: 35%; height: 100%;
                background-color: var(--body-background-color); box-shadow: -5px 0 15px rgba(0,0,0,0.1);
                z-index: 9999; display: flex; flex-direction: column;
                transition: right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); font-family: sans-serif;
            }
            @media (max-width: 767px) { .kwilt-cart-sidebar { width: 100%; right: -100%; } }
            .kwilt-cart-overlay.active, .kwilt-cart-sidebar.active { opacity: 1; visibility: visible; }
            .kwilt-cart-sidebar.active { right: 0; }
            .kwilt-cart-header { padding: 20px; display: flex; justify-content: space-between; align-items: center; }
            .kwilt-cart-header h2 { margin: 0; font-size: 32px; color: var(--kwilt-text-color); }
            .kwilt-cart-exit { cursor: pointer; text-decoration: none; color: var(--kwilt-text-color); font-weight: 500; font-size:16px; }
            .kwilt-cart-body { flex-grow: 1; overflow-y: auto; padding: 20px; position: relative; }
            .kwilt-loader-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: transparent; display: flex; justify-content: center; align-items: center; z-index: 10; }
            .kwilt-loader { display: block; width: 48px; height: 48px; border: 5px solid var(--bark); border-bottom-color: transparent; border-radius: 50%; animation: kwilt-spin 1s linear infinite; }
            @keyframes kwilt-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .kwilt-cart-item { display: flex; margin-bottom: 20px; background: white; padding: 15px; border-radius: 6px; position: relative; align-items: flex-start; }
            .kwilt-cart-item .kwilt-loader-overlay { border-radius: 8px; }
            .kwilt-cart-item-img { width: 100px; height: 100px; object-fit: cover; border-radius: 4px; margin-right: 15px; flex-shrink: 0; background:var(--body-background-color); }
            .kwilt-cart-item-details { flex-grow: 1; display: flex; flex-direction: column; }
            .kwilt-cart-item-header { display: flex; justify-content: space-between; width: 100%; }
            .kwilt-cart-item-name { font-weight:normal; margin: 0 0 5px; font-size: 16px; }
            .kwilt-cart-item-remove { cursor: pointer; font-size: 20px; line-height: 1; position: absolute; top: 10px; right: 10px; }
            .kwilt-cart-item-plan, .kwilt-cart-item-supply { font-size: 14px; color: #666; margin: 2px 0; }
            .kwilt-cart-item-plan {    margin-bottom: 10px}
            .kwilt-cart-item-footer {     display: flex; margin-top: 10px; width: 100%; align-items: center; justify-content: space-between; }
            .kwilt-cart-item-price { font-weight: 500; font-size: 16px; margin-bottom: 5px; }
            .kwilt-quantity-selector { display: flex; align-items: center; border: 1px solid #ccc; border-radius: 4px; }
            .kwilt-quantity-btn { background: none; border: none; cursor: pointer; padding: 5px 10px; font-size: 18px; }
            .kwilt-quantity-value { padding: 0 10px; }
            .kwilt-recommended-section h3 { font-size: 20px; margin-bottom: 15px; font-weight:400; }
            .kwilt-recommended-scroll-container {
                display: flex;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch; /* For smooth scrolling on iOS */
                padding-bottom: 10px; /* Space for potential scrollbar, though it's hidden */
                padding-left: 10px;
            }
            .kwilt-recommended-scroll-container::-webkit-scrollbar {
                display: none; /* Hide scrollbar for Chrome, Safari, Opera */
            }
            .kwilt-recommended-scroll-container { /* Hide scrollbar for IE, Edge, Firefox */
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
            .kwilt-recommended-item {
                display: flex;
                align-items: center;
                background-color: #FFFFFF;
                padding: 16px;
                border-radius: 6px;
                margin-right: 16px; /* Space between items */
                min-width: 350px; /* Increased width for content */
                min-height:110px;
            }

            .kwilt-cart-footer { padding: 20px; border-top: 1px solid #eee; background:white; box-shadow: -5px 0 15px rgba(0,0,0,0.1)}
            .kwilt-discount-section {
                display: flex;
                margin-bottom: 15px;
                background: var(--body-background-color);
                padding: 10px;
                border-radius: 8px;
                border: 1px solid var(--bark);
                height: 50px;
            }
            .kwilt-discount-input {
                flex-grow: 1;
                border: none;
                outline: none;
                border-radius: 4px 0 0 4px;
                padding: 10px;
                background: var(--body-background-color);
            }
            .kwilt-discount-btn {
                /* border: 1px solid var(--bark); */
                /* background-color: var(--bark); */
                /* color: white; */
                padding: 0 20px;
                border-radius: 0 4px 4px 0;
                cursor: pointer;
                /* font-weight: bold; */
                position: relative;
                background: transparent;
                font-size: 16px;
                text-decoration: underline;
            }
            .kwilt-discount-btn .kwilt-btn-loader { width: 18px; height: 18px; border: 2px solid white; border-bottom-color: transparent; }
            .kwilt-summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size:16px; }
            .kwilt-summary-total { font-size: 18px; margin-top: 10px; }
            .kwilt-checkout-btn { display: block; width: 100%; background-color: #FF816B; color: white; text-align: center; padding: 15px; border: none; border-radius: 4px; font-size: 18px; font-weight: 400; cursor: pointer; margin-top: 20px;color:#452D0F; }
            .kwilt-cart-sidebar button:disabled, .kwilt-cart-sidebar input:disabled { opacity: 0.7; cursor: not-allowed; }
            .kwilt-spinner-small { display: inline-block; width: 16px; height: 16px; border: 2px solid currentColor; border-bottom-color: transparent; border-radius: 50%; animation: kwilt-spin 1s linear infinite; vertical-align: middle; }
            .kwilt-applied-coupon {
                display: flex;
                align-items: center;
                background: var(--kwilt-light-gray);
                padding: 10px;
                border-radius: 25px;
                margin-top: 10px;
                font-weight: bold;
                width: fit-content;
            }
            .kwilt-applied-coupon-remove { cursor: pointer; font-size: 18px; margin-left: 10px; background: none; border: none; color: var(--kwilt-text-color); }
            

            .kwilt-recommended-item-img-new {
                width: 80px;
                height: 80px;
                object-fit: cover;
                border-radius: 8px;
                margin-right: 16px;
                background-color: #F0EBE8;
                flex-shrink: 0;
            }
            .kwilt-recommended-item-content {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }
            .kwilt-recommended-item-main {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 8px;
            }
            .kwilt-recommended-name-new {
                font-size: 16px;
                font-weight: 500;
                color: #452D0F;
            }
            .kwilt-recommended-add-btn-new {
                background-color: #FFFFFF;
                color: #452D0F;
                border: 1px solid #452D0F;
                border-radius: 2px;
                padding: 8px 24px;
                cursor: pointer;
                font-weight: 500;
                font-size: 14px;
                white-space: nowrap;
            }
            .kwilt-recommended-item-sub {
                text-align: left;
            }
            .kwilt-recommended-price-desc {
                font-size: 14px;
                color: #6c757d;
                margin-bottom: 4px;
            }
            .kwilt-recommended-price-new {
                font-size: 14px;
                font-weight: 500;
                color: #452D0F;
            }
            /* Quick Add Popup Styles */
            .kwilt-recommended-item .qa-container { position: relative; }
            .kwilt-recommended-item .qa-popup { display: none; position: absolute; bottom: 100%; left: 0; background: #FFFFFF; border: 1px solid #EAE0DC; box-shadow: 0 -4px 12px rgba(0,0,0,0.1); z-index: 10001; width: 340px; overflow: hidden; }
            .kwilt-recommended-item .qa-container.active .qa-popup { display: block; }

            .kwilt-recommended-item .qa-accordion, .kwilt-recommended-item .qa-panel { padding: 20px; cursor: pointer; border-bottom: 1px solid #aeaeae; background-color: #E0DDDD; }
            .kwilt-recommended-item .qa-panel { background-color: #FFFFFF; }
            .kwilt-recommended-item .qa-accordion:last-of-type, .kwilt-recommended-item .qa-panel:last-of-type, .kwilt-recommended-item .qa-accordion + .qa-panel { border-bottom: none; }

            .kwilt-recommended-item .qa-accordion-header, .kwilt-recommended-item .qa-panel-header { display: flex; align-items: center; justify-content: space-between;width:100%; }
            .kwilt-recommended-item .qa-header-content { display: flex; align-items: center; }
            
            .kwilt-recommended-item .qa-radio { width: 20px; height: 20px; border: 1.5px solid #452D0F; border-radius: 50%; margin-right: 15px; flex-shrink: 0; box-sizing: border-box; }
            .kwilt-recommended-item .qa-accordion.selected > .qa-accordion-header .qa-radio, .kwilt-recommended-item .qa-panel.selected .qa-radio, .kwilt-recommended-item .qa-plan-item.selected .qa-radio { background-color: #FF816B; border-color: #FF816B; }

            .kwilt-recommended-item .qa-accordion-title, .kwilt-recommended-item .qa-panel-title { font-weight: 500; color: #452D0F; text-transform: uppercase; font-size: 16px; }
            .kwilt-recommended-item .qa-accordion-price, .kwilt-recommended-item .qa-panel-price { font-weight: 500; color: #452D0F; font-size: 16px; }

            .kwilt-recommended-item .qa-plan-list { display: none; padding-left: 15px; margin-top: 15px; border-top: 1px solid #aeaeae; }
            .kwilt-recommended-item .qa-accordion.selected .qa-plan-list { display: block; }

            .kwilt-recommended-item .qa-plan-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #AEAEAE; }
            .kwilt-recommended-item .qa-plan-item:last-child { border-bottom: none; }
            .kwilt-recommended-item .qa-plan-selection { display: flex; align-items: center; }
            .kwilt-recommended-item .qa-plan-label { color: #452D0F; font-weight: 400; font-size: 16px; }
            .kwilt-recommended-item .qa-plan-price { color: #452D0F; font-weight: 400; font-size: 16px; }

            .kwilt-recommended-item .non-member-pricing{ border:none; }
            .kwilt-recommended-item .non-member-pricing.selected{ border-bottom: 1px solid #aeaeae; }

            .kwilt-recommended-add-btn .button-spinner { border-color: #452D0F; border-bottom-color: transparent; }
            .kwilt-summary-total-price{font-size:24px; font-weight:500;}
            `
            
        document.head.appendChild(style);
    };

    const createCartHTML = () => {
        if (document.getElementById('kwilt-cart-sidebar')) return;
        const overlay = document.createElement('div');
        overlay.id = 'kwilt-cart-overlay';
        overlay.className = 'kwilt-cart-overlay';
        const sidebar = document.createElement('div');
        sidebar.id = 'kwilt-cart-sidebar';
        sidebar.className = 'kwilt-cart-sidebar';
        sidebar.innerHTML = `
            <div class="kwilt-cart-header"><h2>Your cart</h2><a href="#" class="kwilt-cart-exit" data-action="close">EXIT →</a></div>
            <div class="kwilt-cart-body" id="kwilt-cart-body"></div>
            <div class="kwilt-cart-footer">
                <div id="kwilt-coupon-display-container"></div>
                <div class="kwilt-summary" id="kwilt-cart-summary"></div>
                <button class="kwilt-checkout-btn" disabled="${!cartState.items.length}">Checkout</button>
            </div>`;
        document.body.appendChild(overlay);
        document.body.appendChild(sidebar);
    };

    // --- RENDER & DATA MAPPING ---
    const render = () => {
        const body = document.getElementById('kwilt-cart-body');
        const summaryContainer = document.getElementById('kwilt-cart-summary');
        const footer = document.querySelector('.kwilt-cart-footer');

        if (cartState.isLoading) {
            body.innerHTML = `<div class="kwilt-loader-overlay"><div class="kwilt-loader"></div></div>`;
            summaryContainer.innerHTML = '';
            if (footer) footer.style.display = 'none'; // Hide footer when loading
            return;
        }

        if (cartState.items.length === 0) {
            body.innerHTML = '<p style="text-align: center;">Your cart is empty.</p>';
            if (footer) footer.style.display = 'none';
        } else {
            body.innerHTML = `
                <div id="kwilt-cart-items-container">
                    ${cartState.items.map(item => renderCartItem(item)).join('')}
                </div>
                <div class="kwilt-recommended-section">
                    <h3>Recommended</h3>
                    <div class="kwilt-recommended-scroll-container">
                        ${cartState.recommended.map(item => renderRecommendedItem(item)).join('')}
                    </div>
                </div>`;
            if (footer) footer.style.display = 'block'; // Show footer when items are present
        }
        summaryContainer.innerHTML = renderSummary();
        renderCouponDisplay();

        const checkoutButton = document.querySelector('.kwilt-checkout-btn');
        if (checkoutButton) {
            checkoutButton.disabled = cartState.items.length === 0;
        }
        setupRecommendedItemListeners();
    };

    const renderCartItem = (item) => `
        <div class="kwilt-cart-item" data-item-id="${item.item_id}">
            <div class="kwilt-loader-overlay" style="display: none;"><div class="kwilt-loader"></div></div>
            <img src="${item.thumbnail}" alt="${item.product_name}" class="kwilt-cart-item-img">
            <div class="kwilt-cart-item-details">
                <div class="kwilt-cart-item-header">
                    <h4 class="kwilt-cart-item-name">${item.name}</h4>
                    <span class="kwilt-cart-item-remove" data-action="remove-item" data-item-id="${item.item_id}">&times;</span>
                </div>
                <p class="kwilt-cart-item-plan">${item.plan_name} Subscription - $${parseFloat(item.monthly_price || item.price).toFixed(0)}/${item.sku === "MEGA-MEMBERSHIP" ? 'year':'mo'}</p>
                <p class="kwilt-cart-item-supply">$${parseFloat(item.row_total).toFixed(0)} for a ${item.plan_name} supply</p>
                <div class="kwilt-cart-item-footer">
                    <span class="kwilt-cart-item-price">$${parseFloat(item.price).toFixed(0)}</span>
                    <div class="kwilt-quantity-selector">
                        <button class="kwilt-quantity-btn" data-action="decrease-qty" data-item-id="${item.item_id}">-</button>
                        <span class="kwilt-quantity-value">${item.qty}</span>
                        <button class="kwilt-quantity-btn" data-action="increase-qty" data-item-id="${item.item_id}">+</button>
                    </div>
                </div>
            </div>
        </div>`;

    const renderRecommendedItem = (product, index) => {
        const childOptions = product.child_options || [];
        const megaMember = product.mega_member;
        const userIsMember = !!(localStorage.getItem('atkn') && window.memerShip);

        const memberPlanItems = childOptions.map(o => `
            <div class="qa-plan-item" data-sku="${o.sku}" data-oid="${o.__oid}" data-vid="${o.__vid}">
                <div class="qa-plan-selection">
                    <div class="qa-radio"></div>
                    <div class="qa-plan-label">${o.frequency_count} ${o.frequency_unit}</div>
                </div>
                <div class="qa-plan-price">$${parseFloat(o.monthly_mega_member_installment_price).toFixed(0)}/month</div>
            </div>
        `).join('');

        const nonMemberPlanItems = childOptions.map(o => `
            <div class="qa-plan-item" data-sku="${o.sku}" data-oid="${o.__oid}" data-vid="${o.__vid}">
                <div class="qa-plan-selection">
                    <div class="qa-radio"></div>
                    <div class="qa-plan-label">${o.frequency_count} ${o.frequency_unit}</div>
                </div>
                <div class="qa-plan-price">$${parseFloat(o.monthly_installment_price).toFixed(0)}/month</div>
            </div>
        `).join('');

        const defaultOption = product.child_options && product.child_options.length > 0 ? product.child_options[0] : null;
        const price = defaultOption ? defaultOption.installment_price : product.lowest_price;
        const supply_text = defaultOption ? `${defaultOption.frequency_count} ${defaultOption.frequency_unit} supply` : '';

        return `
            <div class="kwilt-recommended-item" data-product-sku="${product.sku}">
                <img src="${product.thumbnail}" alt="${product.product_name}" class="kwilt-recommended-item-img-new">
                <div class="kwilt-recommended-item-content">
                    <div class="kwilt-recommended-item-main">
                        <div class="kwilt-recommended-name-new">${product.product_name}</div>
                        <div class="qa-container" id="qa-rec-container-${index}">
                            <button class="kwilt-recommended-add-btn-new">ADD</button>
                            <div class="qa-popup">
                                <div class="qa-accordion member-pricing">
                                    <div class="qa-accordion-header">
                                        <div class="qa-header-content">
                                            <div class="qa-radio"></div>
                                            <div class="qa-accordion-title">Member Pricing</div>
                                        </div>
                                        <div class="qa-accordion-price">FROM $${childOptions.length > 0 ? parseFloat(childOptions[0].mega_member_installment_price).toFixed(0) : ''}</div>
                                    </div>
                                    <div class="qa-plan-list">
                                        ${memberPlanItems}
                                    </div>
                                </div>
                                <div class="qa-accordion non-member-pricing">
                                    <div class="qa-accordion-header">
                                        <div class="qa-header-content">
                                            <div class="qa-radio"></div>
                                            <div class="qa-accordion-title">Non-Member</div>
                                        </div>
                                        <div class="qa-accordion-price">FROM $${childOptions.length > 0 ? parseFloat(childOptions[0].installment_price).toFixed(0) : ''}</div>
                                    </div>
                                    <div class="qa-plan-list">
                                        ${nonMemberPlanItems}
                                    </div>
                                </div>
                                ${megaMember && !userIsMember ? `
                                <div class="qa-panel comprehensive-panel" data-sku="${megaMember.sku}" data-oid="${megaMember.__oid}" data-vid="${megaMember.__vid}">
                                    <div class="qa-panel-header">
                                        <div class="qa-header-content">
                                            <div class="qa-radio"></div>
                                            <div class="qa-panel-title">Comprehensive Panel</div>
                                        </div>
                                        <div class="qa-panel-price">$${parseFloat(megaMember.installment_price).toFixed(0)}/year</div>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="kwilt-recommended-item-sub">
                        <div class="kwilt-recommended-price-desc">$${parseFloat(price).toFixed(0)} for a ${supply_text}</div>
                        <div class="kwilt-recommended-price-new">$${parseFloat(price).toFixed(0)}</div>
                    </div>
                </div>
            </div>
        `;
    };

    const renderSummary = () => `
        <div class="kwilt-summary-row"><span>Subtotal:</span><span>$${cartState.subtotal.toFixed(2)}</span></div>
        <div class="kwilt-summary-row"><span>FREE SHIPPING:</span><span>${cartState.shipping === 0 ? '$0.00': '$' + cartState.shipping.toFixed(2)}</span></div>
        ${cartState.discount ? `<div class="kwilt-summary-row"><span>Discount (${cartState.discount.code}):</span><span>-$${Math.abs(cartState.discount.amount).toFixed(2)}</span></div>` : ''}
        <div class="kwilt-summary-row kwilt-summary-total"><span>Total:</span><span class="kwilt-summary-total-price">$${cartState.total.toFixed(2)}</span></div>`;

    const _getCouponSectionHtml = () => {
        let couponHtml = `
            <div class="kwilt-discount-section">
                <input type="text" class="kwilt-discount-input" placeholder="Discount or Gift Card Code">
                <button class="kwilt-discount-btn" data-action="apply-discount">Apply</button>
            </div>`;

        if (cartState.discount) {
            couponHtml += `
                <div class="kwilt-applied-coupon">
                    <span>${cartState.discount.code}</span>
                    <button class="kwilt-applied-coupon-remove" data-action="remove-coupon">&times;</button>
                </div>`;
        }
        return couponHtml;
    };

    const renderCouponDisplay = () => {
        const couponContainer = document.getElementById('kwilt-coupon-display-container');
        if (couponContainer) {
            couponContainer.innerHTML = _getCouponSectionHtml();
        }
    };

    const updateStateFromApi = async (apiData) => {
        cartState.items = apiData.items || [];
        cartState.subtotal = parseFloat(apiData.cart_total.subtotal || 0);
        cartState.total = parseFloat(apiData.cart_total.grand_total || 0);
        cartState.shipping = parseFloat(apiData.cart_total.shipping_amount || 0);
        const coupon = apiData.applied_coupons;
        if (coupon) {
            cartState.discount = { code: coupon, amount: parseFloat(apiData.cart_total.discount_amount || 0) };
        } else {
            cartState.discount = null;
        }

        // Fetch and filter recommended items
        const recommendedResult = await cartApi.getRecommendedProducts();
        if (recommendedResult.success && recommendedResult.data && Array.isArray(recommendedResult.data.products)) {
            const cartItemSkus = new Set(cartState.items.map(item => item.sku));
            cartState.recommended = recommendedResult.data.products.filter(recItem => !cartItemSkus.has(recItem.sku));
        } else {
            cartState.recommended = [];
        }
    };

    // --- EVENT HANDLERS & LOGIC ---
    const originalButtonTexts = new Map();

    const setupRecommendedItemListeners = () => {
        const allContainers = document.querySelectorAll('.kwilt-cart-body .qa-container');
        let leaveTimeout;

        // Store original parent and nextSibling for each popup
        const popupOriginalPositions = new Map();

        const resetPopupState = (container) => {
            if (container) {
                container.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
            }
        };

        if (!window.kwiltCartPopupCloser) {
            window.kwiltCartPopupCloser = (e) => {
                allContainers.forEach(container => {
                    if (!container.contains(e.target)) {
                        if (container.classList.contains('active')) {
                            resetPopupState(container);
                        }
                        container.classList.remove('active', 'clicked');
                        // Ensure popup is moved back to original position if active
                        const popup = container.querySelector('.qa-popup');
                        if (popup && popupOriginalPositions.has(popup)) {
                            const { parent, nextSibling } = popupOriginalPositions.get(popup);
                            if (nextSibling) {
                                parent.insertBefore(popup, nextSibling);
                            } else {
                                parent.appendChild(popup);
                            }
                            popup.style.position = '';
                            popup.style.top = '';
                            popup.style.left = '';
                            popup.style.width = '';
                        }
                    }
                });
            };
            document.body.addEventListener('click', window.kwiltCartPopupCloser, true);
        }

        allContainers.forEach(container => {
            const quickAddBtn = container.querySelector('.kwilt-recommended-add-btn-new');
            const popup = container.querySelector('.qa-popup');

            // Store original position
            if (popup && !popupOriginalPositions.has(popup)) {
                popupOriginalPositions.set(popup, {
                    parent: popup.parentNode,
                    nextSibling: popup.nextSibling
                });
            }
            
            const openPopup = () => {
                clearTimeout(leaveTimeout);
                allContainers.forEach(c => {
                    if (c !== container) {
                        if (c.classList.contains('active')) {
                           resetPopupState(c);
                        }
                        c.classList.remove('active', 'clicked');
                        // Ensure other popups are moved back to original position
                        const otherPopup = c.querySelector('.qa-popup');
                        if (otherPopup && popupOriginalPositions.has(otherPopup)) {
                            const { parent, nextSibling } = popupOriginalPositions.get(otherPopup);
                            if (nextSibling) {
                                parent.insertBefore(otherPopup, nextSibling);
                            } else {
                                parent.appendChild(otherPopup);
                            }
                            otherPopup.style.position = '';
                            otherPopup.style.top = '';
                            otherPopup.style.left = '';
                            otherPopup.style.width = '';
                        }
                    }
                });

                const recommendedItem = container.closest('.kwilt-recommended-item');
                if (recommendedItem) {
                    popup.style.width = `${recommendedItem.offsetWidth}px`;
                }
                container.classList.add('active');

                // --- Start: DOM Manipulation for positioning ---
                const btnRect = quickAddBtn.getBoundingClientRect();
                const popupRect = popup.getBoundingClientRect(); // Get initial dimensions

                // Calculate desired position relative to viewport
                const desiredTop = btnRect.top - popupRect.height;
                const desiredLeft = btnRect.left; // Align left with button

                // Move popup to body and position fixed
                document.body.appendChild(popup);
                popup.style.position = 'fixed';
                popup.style.top = `${desiredTop}px`;
                popup.style.left = `${desiredLeft}px`;
                popup.style.width = `${recommendedItem.offsetWidth}px`; // Ensure width is maintained
                // --- End: DOM Manipulation for positioning ---
            };

            const closePopup = () => {
                leaveTimeout = setTimeout(() => {
                    if (!container.classList.contains('clicked')) {
                        container.classList.remove('active');
                        resetPopupState(container);
                        // Move popup back to original position
                        if (popupOriginalPositions.has(popup)) {
                            const { parent, nextSibling } = popupOriginalPositions.get(popup);
                            if (nextSibling) {
                                parent.insertBefore(popup, nextSibling);
                            } else {
                                parent.appendChild(popup);
                            }
                            popup.style.position = '';
                            popup.style.top = '';
                            popup.style.left = '';
                            popup.style.width = '';
                        }
                    }
                }, 100);
            };

            container.addEventListener('mouseenter', openPopup);
            container.addEventListener('mouseleave', closePopup);
            popup.addEventListener('mouseenter', () => clearTimeout(leaveTimeout));
            popup.addEventListener('mouseleave', closePopup);

            quickAddBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                clearTimeout(leaveTimeout);
                if (container.classList.contains('clicked')) {
                    container.classList.remove('clicked');
                    resetPopupState(container);
                    // Move popup back to original position
                    if (popupOriginalPositions.has(popup)) {
                        const { parent, nextSibling } = popupOriginalPositions.get(popup);
                        if (nextSibling) {
                            parent.insertBefore(popup, nextSibling);
                        } else {
                            parent.appendChild(popup);
                        }
                        popup.style.position = '';
                        popup.style.top = '';
                        popup.style.left = '';
                        popup.style.width = '';
                    }
                } else {
                    openPopup();
                    container.classList.add('clicked');
                }
            });

            const panel = container.querySelector('.qa-panel');
            const allOptions = container.querySelectorAll('.qa-accordion, .qa-panel');
            const allPlanItems = container.querySelectorAll('.qa-plan-item');
            const userIsMember = !!window.memerShip;

            if (userIsMember && panel) {
                panel.style.display = 'none';
            }

            allOptions.forEach(option => {
                const header = option.querySelector('.qa-accordion-header, .qa-panel-header');
                header.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isAccordion = option.classList.contains('qa-accordion');
                    const isMemberPricing = option.classList.contains('member-pricing');
                    const isComprehensivePanel = option.classList.contains('comprehensive-panel');

                    if (isAccordion && option.classList.contains('selected')) {
                        option.classList.remove('selected');
                        option.querySelectorAll('.qa-plan-item.selected').forEach(pi => pi.classList.remove('selected'));
                        if (isMemberPricing && panel) {
                            panel.classList.remove('selected');
                        }
                        return;
                    }

                    container.querySelectorAll('.qa-accordion').forEach(acc => acc.classList.remove('selected'));
                    
                    option.classList.add('selected');

                    if (!userIsMember && panel) {
                        const memberPricingAccordion = container.querySelector('.member-pricing');
                        if (isMemberPricing) {
                            panel.classList.add('selected');
                        } else if (isComprehensivePanel) {
                            if(memberPricingAccordion) memberPricingAccordion.classList.add('selected');
                        } else {
                            panel.classList.remove('selected');
                        }
                    }
                });
            });

            allPlanItems.forEach(item => {
                item.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const parentAccordion = item.closest('.qa-accordion');
                    if (!parentAccordion) return;

                    parentAccordion.querySelectorAll('.qa-plan-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    
                    if (!parentAccordion.classList.contains('selected')) {
                        container.querySelectorAll('.qa-accordion').forEach(i => i.classList.remove('selected'));
                        parentAccordion.classList.add('selected');
                    }

                    if (!userIsMember && panel) {
                        if (parentAccordion.classList.contains('member-pricing')) {
                            panel.classList.add('selected');
                        } else {
                            panel.classList.remove('selected');
                        }
                    }

                    setButtonLoading(quickAddBtn, true);
                    const isGuest = !getAuthToken();
                    const isPanelSelected = panel && panel.classList.contains('selected');

                    try {
                        let successMessage = 'Item added to cart!';
                        const planPayload = { sku: item.dataset.sku, __co: [{ "__oid": parseInt(item.dataset.oid), "__ov": parseInt(item.dataset.vid) }], __q: 1 };

                        if (userIsMember) {
                            await cartApi.addItem(planPayload);
                        } else if (isPanelSelected) {
                            successMessage = 'Items added to cart!';
                            const panelPayload = { sku: panel.dataset.sku, __co: [{ "__oid": parseInt(panel.dataset.oid), "__ov": parseInt(panel.dataset.vid) }], __q: 1 };
                            await cartApi.addItem(panelPayload);
                            await cartApi.addItem(planPayload);
                        } else {
                            await cartApi.addItem(planPayload);
                        }
                        
                        await refreshCart();
                        window.showToast(successMessage, 'success');

                    } catch (error) {
                        window.showToast('There was a problem adding items to your cart. Please try again.', 'error');
                    } finally {
                        setButtonLoading(quickAddBtn, false);
                        container.classList.remove('active', 'clicked');
                        resetPopupState(container);
                        // Move popup back to original position after action
                        if (popupOriginalPositions.has(popup)) {
                            const { parent, nextSibling } = popupOriginalPositions.get(popup);
                            if (nextSibling) {
                                parent.insertBefore(popup, nextSibling);
                            } else {
                                parent.appendChild(popup);
                            }
                            popup.style.position = '';
                            popup.style.top = '';
                            popup.style.left = '';
                            popup.style.width = '';
                        }
                    }
                });
            });
        });
    };

    const setButtonLoading = (buttonElement, loading, loaderHtml = '<span class="kwilt-spinner-small"></span>') => {
        if (!buttonElement) return;

        if (loading) {
            if (!originalButtonTexts.has(buttonElement)) {
                originalButtonTexts.set(buttonElement, buttonElement.innerHTML);
            }
            buttonElement.innerHTML = loaderHtml;
            buttonElement.disabled = true;
        } else {
            if (originalButtonTexts.has(buttonElement)) {
                buttonElement.innerHTML = originalButtonTexts.get(buttonElement);
                originalButtonTexts.delete(buttonElement);
            }
            buttonElement.disabled = false;
        }
    };

    const setCartLock = (locked) => {
        const sidebar = document.getElementById('kwilt-cart-sidebar');
        if (!sidebar) return;
        sidebar.querySelectorAll('button, input, .kwilt-cart-item-remove').forEach(el => el.disabled = locked);
    };

    const refreshCart = async () => {
        setCartLock(true);
        const result = await cartApi.getCart();
        if (result.success) {
            await updateStateFromApi(result.data);
            render();
        } else {
            window.showToast('Could not refresh cart. Please try again.', 'error');
        }
        setCartLock(false);
    };

    const handleCartClick = async (e) => {
        const action = e.target.dataset.action;
        if (!action) return;

        setCartLock(true); // Disable all cart buttons immediately

        const itemId = e.target.dataset.itemId;
        const sku = e.target.dataset.sku;

        try {
            switch (action) {
            case 'close': toggleCart(false); break;
            case 'increase-qty':
            case 'decrease-qty': {
                const item = cartState.items.find(i => i.item_id == itemId);
                if (item) {
                    const targetButton = e.target.closest('button');
                    const newQuantity = action === 'increase-qty' ? item.qty + 1 : item.qty - 1;
                    if (newQuantity > 0) {
                        setButtonLoading(targetButton, true);
                        await cartApi.updateItem(itemId, newQuantity);
                        await refreshCart();
                        window.showToast('Cart updated.', 'success');
                        setButtonLoading(targetButton, false);
                    } else { // newQuantity is 0, so delete it
                        setButtonLoading(targetButton, true);
                        await cartApi.deleteItem(itemId);
                        await refreshCart();
                        window.showToast('Item removed.', 'success');
                        setButtonLoading(targetButton, false);
                    }
                }
                break;
            }
            case 'remove-item': {
                const targetButton = e.target.closest('span'); // Target the span for remove button
                setButtonLoading(targetButton, true);
                await cartApi.deleteItem(itemId);
                await refreshCart();
                window.showToast('Item removed.', 'success');
                setButtonLoading(targetButton, false);
                break;
            }
            case 'add-recommended': {
                const targetButton = e.target.closest('button');
                setButtonLoading(targetButton, true);
                await cartApi.addItem(sku);
                await refreshCart();
                window.showToast('Item added.', 'success');
                setButtonLoading(targetButton, false);
                break;
            }
            case 'apply-discount': {
                const input = document.querySelector('.kwilt-discount-input');
                const applyButton = e.target.closest('button');
                const code = input.value.trim();
                if (code) {
                    setButtonLoading(applyButton, true);
                    input.disabled = true;
                    const result = await cartApi.applyCoupon(code);
                    if (!result.success) {
                        window.showToast('Invalid coupon code. Please try again.', 'error');
                    } else {
                        window.showToast('Coupon applied!', 'success');

                        // Braze Tracking: Coupon Applied
                        if (window.trackEvent) {
                            const eventProperties = {
                                coupon_code: code,
                                cart_total: cartState.total,
                                timestamp: new Date().toISOString()
                            };
                            window.trackEvent('coupon_applied', eventProperties);
                            console.log('Braze event fired: coupon_applied', eventProperties);
                        }
                    }
                    await refreshCart();
                    setButtonLoading(applyButton, false);
                    input.disabled = false;
                }
                break;
            }
            case 'remove-coupon': {
                const removeButton = e.target.closest('button');
                setButtonLoading(removeButton, true);
                const result = await cartApi.removeCoupon();
                if (!result.success) {
                    window.showToast('Failed to remove coupon. Please try again.', 'error');
                } else {
                    window.showToast('Coupon removed.', 'success');
                }
                await refreshCart();
                setButtonLoading(removeButton, false);
                break;
            }
        }
        } finally {
            setCartLock(false); // Re-enable all cart buttons
        }
    };

    const toggleCart = async (show) => {
        const sidebar = document.getElementById('kwilt-cart-sidebar');
        const overlay = document.getElementById('kwilt-cart-overlay');
        const shouldOpen = show !== undefined ? show : !cartState.isOpened;

        if (shouldOpen) {
            cartState.isOpened = true;
            sidebar.classList.add('active');
            overlay.classList.add('active');
            cartState.isLoading = true;
            render();
            const result = await cartApi.getCart();
            if (result.success) {
                await updateStateFromApi(result.data);

                // Braze Tracking: Cart Viewed
                if (window.trackEvent) {
                    const eventProperties = {
                        cart_total: cartState.total,
                        item_count: cartState.items.length,
                        cart_items: cartState.items.map(item => ({
                            product_id: item.sku,
                            product_name: item.name,
                            quantity: item.qty,
                            price: item.price
                        })),
                        timestamp: new Date().toISOString()
                    };
                    window.trackEvent('cart_viewed', eventProperties);
                    console.log('Braze event fired: cart_viewed', eventProperties);
                }
            }
            cartState.isLoading = false;
            render();
        } else {
            cartState.isOpened = false;
            cartState.items = []
            cartState.recommended = []
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    };

    // --- INITIALIZATION ---
    const init = () => {
        injectStyles();
        createCartHTML();
        document.getElementById('kwilt-cart-sidebar').addEventListener('click', handleCartClick);
        document.getElementById('kwilt-cart-overlay').addEventListener('click', () => toggleCart(false));
        document.querySelector('.kwilt-checkout-btn').addEventListener('click', () => {
            if (cartState.items.length && cartState.items.length > 0) {

                // Braze Tracking: Checkout Initiated
                if (window.trackEvent) {
                    const eventProperties = {
                        cart_total: cartState.total,
                        item_count: cartState.items.length,
                        cart_items: cartState.items.map(item => ({
                            product_id: item.sku,
                            product_name: item.name,
                            quantity: item.qty,
                            price: item.price
                        })),
                        has_coupon: !!cartState.discount,
                        timestamp: new Date().toISOString()
                    };
                    window.trackEvent('checkout_initiated', eventProperties);
                    console.log('Braze event fired: checkout_initiated', eventProperties);
                }

                let url = 'https://kwilt-vuejs-396730550724.us-central1.run.app/checkout'
                const cartId = localStorage.getItem(CART_ID_KEY) || null
                if (window.authToken) {
                    url = url + `?t=${window.authToken}`
                } else if (cartId) {
                    url = url + `?cid=${cartId}`
                }
                window.location.href = url;
            }
        });
        // Delegated event listener for discount input Enter key
        const couponDisplayContainer = document.getElementById('kwilt-coupon-display-container');
        if (couponDisplayContainer) {
            couponDisplayContainer.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.target.classList.contains('kwilt-discount-input')) {
                    e.preventDefault();
                    const applyButton = couponDisplayContainer.querySelector('.kwilt-discount-btn[data-action="apply-discount"]');
                    if (applyButton) {
                        applyButton.click();
                    }
                }
            });
        }

        window.toggleCart = toggleCart;
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();