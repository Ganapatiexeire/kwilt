
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
        addItem: async (sku) => { // Assuming simple product add for recommended
            const authToken = getAuthToken();
            let bodyData = { sku: sku, __q: 1 };
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
                --kwilt-text-color: #333;
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
            .kwilt-cart-header h2 { margin: 0; font-size: 24px; color: var(--kwilt-text-color); }
            .kwilt-cart-exit { cursor: pointer; text-decoration: none; color: var(--kwilt-text-color); font-weight: bold; }
            .kwilt-cart-body { flex-grow: 1; overflow-y: auto; padding: 20px; position: relative; }
            .kwilt-loader-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: transparent; display: flex; justify-content: center; align-items: center; z-index: 10; }
            .kwilt-loader { display: block; width: 48px; height: 48px; border: 5px solid var(--bark); border-bottom-color: transparent; border-radius: 50%; animation: kwilt-spin 1s linear infinite; }
            @keyframes kwilt-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .kwilt-cart-item { display: flex; margin-bottom: 20px; background: white; padding: 15px; border-radius: 8px; position: relative; align-items: flex-start; }
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
            .kwilt-recommended-section h3 { font-size: 18px; margin-bottom: 15px; }
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
            .kwilt-recommended-item { flex: 0 0 auto; margin-right: 15px; display: flex; align-items: center; background: white; padding: 15px; border-radius: 8px; min-width:300px; }
            .kwilt-recommended-item-img { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 15px; }
            .kwilt-recommended-details { flex-grow: 1; text-align: left; }
            .kwilt-recommended-name {
                font-weight: normal;
                font-size: 14px;
                margin-bottom: 10px;
            }
            .kwilt-recommended-plan, .kwilt-recommended-price { font-size: 14px; color: #666; }
            .kwilt-recommended-add-btn { background-color: white; color: var(--bark); border: 1px solid #ddd; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-left: 10px; }
            .kwilt-cart-footer { padding: 20px; border-top: 1px solid #eee; background:white; box-shadow: -5px 0 15px rgba(0,0,0,0.1)}
            .kwilt-discount-section {
                display: flex;
                margin-bottom: 15px;
                background: var(--body-background-color);
                padding: 10px;
                border-radius: 16px;
                border: 1px solid var(--bark);
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
            }
            .kwilt-discount-btn .kwilt-btn-loader { width: 18px; height: 18px; border: 2px solid white; border-bottom-color: transparent; }
            .kwilt-summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .kwilt-summary-total { font-weight: bold; font-size: 18px; margin-top: 10px; }
            .kwilt-checkout-btn { display: block; width: 100%; background-color: var(--kwilt-red); color: white; text-align: center; padding: 15px; border: none; border-radius: 4px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 20px; }
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
        `;
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
                <p class="kwilt-cart-item-plan">${item.plan_name} Subscription - $${parseFloat(item.price).toFixed(2)}/mo</p>
                <p class="kwilt-cart-item-supply">$${parseFloat(item.row_total).toFixed(2)} for a ${item.plan_name} supply</p>
                <div class="kwilt-cart-item-footer">
                    <span class="kwilt-cart-item-price">$${parseFloat(item.price).toFixed(2)}</span>
                    <div class="kwilt-quantity-selector">
                        <button class="kwilt-quantity-btn" data-action="decrease-qty" data-item-id="${item.item_id}">-</button>
                        <span class="kwilt-quantity-value">${item.qty}</span>
                        <button class="kwilt-quantity-btn" data-action="increase-qty" data-item-id="${item.item_id}">+</button>
                    </div>
                </div>
            </div>
        </div>`;

    const renderRecommendedItem = (item) => `
        <div>
            <div class="kwilt-recommended-item" data-item-id="${item.id}" data-sku="${item.sku}">
                <img src="${item.image}" alt="${item.name}" class="kwilt-recommended-item-img">
                <div class="kwilt-recommended-details">
                    <div class="kwilt-recommended-name">${item.name}</div>
                    <div class="kwilt-recommended-plan">${item.plan}</div>
                    <div class="kwilt-recommended-price">$${item.price.toFixed(2)}</div>
                </div>
                <button class="kwilt-recommended-add-btn" data-action="add-recommended" data-sku="${item.sku}">ADD</button>
            </div>
        </div>`;

    const renderSummary = () => `
        <div class="kwilt-summary-row"><span>Subtotal:</span><span>$${cartState.subtotal.toFixed(2)}</span></div>
        <div class="kwilt-summary-row"><span>Shipping:</span><span>${cartState.shipping === 0 ? 'FREE' : '$' + cartState.shipping.toFixed(2)}</span></div>
        ${cartState.discount ? `<div class="kwilt-summary-row"><span>Discount (${cartState.discount.code}):</span><span>-$${Math.abs(cartState.discount.amount).toFixed(2)}</span></div>` : ''}
        <div class="kwilt-summary-row kwilt-summary-total"><span>Total:</span><span>$${cartState.total.toFixed(2)}</span></div>`;

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
            cartState.recommended = recommendedResult.data.products.filter(recItem => !cartItemSkus.has(recItem.sku))
                .map(recItem => ({
                    id: recItem.sku, // Using sku as id for consistency
                    sku: recItem.sku,
                    name: recItem.product_name,
                    plan: recItem.plan_name,
                    price: parseFloat(recItem.price),
                    image: recItem.thumbnail
                }));
        } else {
            cartState.recommended = [];
        }
    };

    // --- EVENT HANDLERS & LOGIC ---
    const originalButtonTexts = new Map();

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
                        window.showToast(result.message || 'Invalid coupon code. Please try again.', 'error');
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
                    window.showToast(result.message || 'Failed to remove coupon.', 'error');
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