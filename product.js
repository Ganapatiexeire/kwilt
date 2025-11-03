const API_URL = 'https://kwilt-intake-396730550724.us-central1.run.app/products';

// --- START: Static Data for Quick Add ---
const staticProductData = {
    "child_options": [
        { "sku": "membership", "product_name": "Semaglutide", "subscription_active": true, "frequency_count": "28", "frequency_unit": "day", "installment_price": "249.00", "adjustment_price": "0.00", "mega_member_installment_price": "225.00", "__oid": 55, "__vid": 200 },
        { "sku": "sema-12-week", "product_name": "Semaglutide", "subscription_active": true, "frequency_count": "12", "frequency_unit": "week", "installment_price": "710.00", "adjustment_price": "0.00", "mega_member_installment_price": "685.00", "__oid": 23, "__vid": 172 },
        { "sku": "sema-6-month", "product_name": "Semaglutide", "subscription_active": true, "frequency_count": "24", "frequency_unit": "week", "installment_price": "1345.00", "adjustment_price": "0.00", "mega_member_installment_price": "1325.00", "__oid": 25, "__vid": 173 },
        { "sku": "sema-12-month", "product_name": "Semaglutide", "subscription_active": true, "frequency_count": "48", "frequency_unit": "week", "installment_price": "2540.00", "adjustment_price": "0.00", "mega_member_installment_price": "2525.00", "__oid": 27, "__vid": 174 }
    ],
    "mega_member": { "sku": "MEGA-MEMBERSHIP", "product_name": "Comprehensive Panel", "subscription_active": true, "frequency_count": "365", "frequency_unit": "day", "installment_price": "449.00", "adjustment_price": "0.00", "mega_member_installment_price": "0.00", "__oid": 44, "__vid": 201 }
};
// --- END: Static Data for Quick Add ---

window.kwiltProductUtils = window.kwiltProductUtils || {};

// --- START: Cart Management ---
const CART_API_URL = 'https://kwilt-order-396730550724.us-central1.run.app/nonrx-cart/addItemToCart';
const CART_ID_KEY = '__cid';
const getCartId = () => localStorage.getItem(CART_ID_KEY);
const setCartId = (cartId) => { if (cartId) localStorage.setItem(CART_ID_KEY, cartId); };

const addToCartAPI = async (payload, isGuest) => {
    const headers = { 'Content-Type': 'application/json' };
    if (!isGuest && window.authToken) {
        headers['Authorization'] = `Bearer ${window.authToken}`;
    } else {
        const cartId = getCartId();
        if (cartId) payload.__cid = cartId;
    }
    try {
        const response = await fetch(CART_API_URL, { method: 'POST', headers, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || `API request failed`);
        if (isGuest && result.data && !getCartId()) setCartId(result.data);
        return result;
    } catch (error) {
        console.error('Add to cart failed:', error);
        throw error;
    }
};
// --- END: Cart Management ---

// --- Start: UI Styles and Helpers ---
const injectStyles = () => {
    if (document.getElementById('kwilt-product-styles')) return;
    const style = document.createElement('style');
    style.id = 'kwilt-product-styles';
    style.innerHTML = `
        .kwilt-loader { display: block; width: 48px; height: 48px; border: 5px solid #452D0F; border-bottom-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 100px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .button-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #fff; border-bottom-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
        
        .qa-container { position: relative; }
        .qa-popup { display: none; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background: #fff; border: 1px solid #e0e0e0; box-shadow: 0 -4px 12px rgba(0,0,0,0.1); z-index: 10; width: 320px; border-radius: 8px; padding: 15px; }
        .qa-container.active .qa-popup { display: block; }

        .qa-accordion, .qa-panel {
            border: 1px solid #e0dcdc;
            border-radius: 6px;
            margin-bottom: 8px;
            background-color: #f5eeec;
        }

        .qa-accordion-header, .qa-panel-header {
            display: flex; align-items: center; padding: 12px; cursor: pointer;
        }

        .qa-radio { width: 20px; height: 20px; border: 1.5px solid #452d0f; border-radius: 50%; margin-right: 12px; flex-shrink: 0; position: relative; }
        .qa-accordion.selected .qa-radio, .qa-panel.selected .qa-radio {
            background-color: #452d0f;
        }
        .qa-accordion.selected .qa-radio::after, .qa-panel.selected .qa-radio::after {
            content: ''; position: absolute; top: 50%; left: 50%; width: 8px; height: 8px; background: white; border-radius: 50%; transform: translate(-50%, -50%);
        }

        .qa-accordion-title, .qa-panel-title { font-weight: 500; text-transform: uppercase; font-size: 14px; flex-grow: 1; }
        .qa-accordion-price, .qa-panel-price { font-size: 14px; }

        .qa-plan-list { display: none; padding: 5px 10px 10px; border-top: 1px solid #e0dcdc; margin-top: 10px; }
        .qa-accordion.selected .qa-plan-list { display: block; }

        .qa-plan-item { display: flex; align-items: center; padding: 8px; cursor: pointer; border-radius: 4px; }
        .qa-plan-item:hover { background-color: #ede3e0; }
        .qa-plan-item.selected { background-color: #e0dcdc; }
        .qa-plan-details { display: flex; justify-content: space-between; flex-grow: 1; font-size: 14px; padding-left: 10px; }

        .qa-add-to-cart-btn { margin-top: 10px; width: 100%; padding: 12px; font-size: 16px; }
    `;
    document.head.appendChild(style);
};

const showLoader = (container) => { if (!container) return; container.innerHTML = '<div class="kwilt-loader"></div>'; };
const showButtonSpinner = (button) => { button.disabled = true; button.style.display = 'flex'; button.style.justifyContent = 'center'; button.style.alignItems = 'center'; button.innerHTML = '<span class="button-spinner"></span>'; };
const hideButtonSpinner = (button, text = 'ADD TO CART') => { button.disabled = false; button.style.display = ''; button.style.justifyContent = ''; button.style.alignItems = ''; button.innerHTML = text; };

// --- End: UI Styles and Helpers ---

const fetchProducts = async () => {
    try {
        const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        if (!response.ok) throw new Error(`API request failed`);
        const data = await response.json();
        return data.data.products || [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};

const _renderProductsToDOM = (products) => {
    const container = document.getElementById('slicksliderproduct');
    if (!container) { console.error('Product container #slicksliderproduct not found.'); return; }
    container.innerHTML = '';

    if (!products || products.length === 0) { container.innerHTML = '<p>No products found.</p>'; return; }

    products.forEach((product, index) => {
        const productElement = document.createElement('div');
        productElement.classList.add('collection-item', 'w-dyn-item', 'w-col', 'w-col-4');

        const memberPlanItems = staticProductData.child_options.map(o => `<div class="qa-plan-item" data-sku="${o.sku}" data-oid="${o.__oid}" data-vid="${o.__vid}"><div class="qa-plan-details"><div class="qa-plan-label">${o.frequency_count} ${o.frequency_unit}</div><div class="qa-plan-price">${parseFloat(o.mega_member_installment_price).toFixed(0)}</div></div></div>`).join('');
        const nonMemberPlanItems = staticProductData.child_options.map(o => `<div class="qa-plan-item" data-sku="${o.sku}" data-oid="${o.__oid}" data-vid="${o.__vid}"><div class="qa-plan-details"><div class="qa-plan-label">${o.frequency_count} ${o.frequency_unit}</div><div class="qa-plan-price">${parseFloat(o.installment_price).toFixed(0)}</div></div></div>`).join('');

        productElement.innerHTML = `
            <div class="product-wrap">
                <div class="pl-image"><a href="/product/${product.sku}" class="fullwidth w-inline-block"><img src="${product.thumbnail}" loading="lazy" alt="${product.product_name}" class="image-29"></a></div>
                <div class="pl-content">
                    <div class="product-name">${product.product_name}</div>
                    <div class="pl-meta">${product.lowest_price}/mo</div>
                    <div class="qa-container" id="qa-container-${index}">
                        <button class="button add-tocart-button w-button">ADD TO CART</button>
                        <div class="qa-popup">
                            <div class="qa-accordion" id="qa-member-pricing-accord">
                                <div class="qa-accordion-header"><div class="qa-radio"></div><div class="qa-accordion-title">Member Pricing</div><div class="qa-accordion-price">from ${parseFloat(staticProductData.child_options[0].mega_member_installment_price).toFixed(0)}</div></div>
                                <div class="qa-plan-list">${memberPlanItems}</div>
                            </div>
                            <div class="qa-accordion" id="qa-non-member-accord">
                                <div class="qa-accordion-header"><div class="qa-radio"></div><div class="qa-accordion-title">Non-Member</div><div class="qa-accordion-price">from ${parseFloat(staticProductData.child_options[0].installment_price).toFixed(0)}</div></div>
                                <div class="qa-plan-list">${nonMemberPlanItems}</div>
                            </div>
                            <div class="qa-panel" id="qa-comprehensive-panel">
                                <div class="qa-panel-header"><div class="qa-radio"></div><div class="qa-panel-title">Comprehensive Panel</div><div class="qa-panel-price">${parseFloat(staticProductData.mega_member.installment_price).toFixed(0)}/year</div></div>
                            </div>
                            <button class="button qa-add-to-cart-btn w-button">Add to Cart</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(productElement);
    });
    setupQuickAddListeners();
};

const setupQuickAddListeners = () => {
    const containers = document.querySelectorAll('.qa-container');

    document.body.addEventListener('click', (e) => {
        containers.forEach(container => {
            if (!container.contains(e.target)) {
                container.classList.remove('active');
                container.querySelector('.add-tocart-button').textContent = 'ADD TO CART';
            }
        });
    });

    containers.forEach(container => {
        const quickAddBtn = container.querySelector('.add-tocart-button');
        quickAddBtn.addEventListener('mouseenter', () => { quickAddBtn.textContent = 'QUICK ADD'; });
        quickAddBtn.addEventListener('mouseleave', () => { if (!container.classList.contains('active')) quickAddBtn.textContent = 'ADD TO CART'; });
        quickAddBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = container.classList.contains('active');
            document.querySelectorAll('.qa-container').forEach(c => c.classList.remove('active'));
            if (!isActive) container.classList.add('active');
        });

        const memberAccordion = container.querySelector('#qa-member-pricing-accord');
        const nonMemberAccordion = container.querySelector('#qa-non-member-accord');
        const comprehensivePanel = container.querySelector('#qa-comprehensive-panel');
        const allPlanItems = container.querySelectorAll('.qa-plan-item');
        const addToCartBtn = container.querySelector('.qa-add-to-cart-btn');

        const userIsMember = !!window.memerShip;

        const selectMemberPricing = () => {
            memberAccordion.classList.add('selected');
            nonMemberAccordion.classList.remove('selected');
            if (!userIsMember) comprehensivePanel.classList.add('selected');
        };

        const selectNonMemberPricing = () => {
            nonMemberAccordion.classList.add('selected');
            memberAccordion.classList.remove('selected');
            comprehensivePanel.classList.remove('selected');
        };

        if (userIsMember) {
            comprehensivePanel.style.display = 'none';
            selectMemberPricing();
        } else {
            selectNonMemberPricing();
        }

        memberAccordion.addEventListener('click', selectMemberPricing);
        nonMemberAccordion.addEventListener('click', selectNonMemberPricing);
        comprehensivePanel.addEventListener('click', () => { if (!userIsMember) selectMemberPricing(); });

        allPlanItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const parentAccordion = item.closest('.qa-accordion');
                if (parentAccordion.id === 'qa-member-pricing-accord') selectMemberPricing();
                else selectNonMemberPricing();
                
                parentAccordion.querySelectorAll('.qa-plan-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
            });
        });

        addToCartBtn.addEventListener('click', async () => {
            const selectedPlan = container.querySelector('.qa-plan-item.selected');
            if (!selectedPlan) { window.showToast('Please select a plan.', 'error'); return; }

            showButtonSpinner(addToCartBtn);
            const isGuest = !window.authToken;
            const isPanelSelected = comprehensivePanel.classList.contains('selected');

            try {
                let successMessage = 'Item added to cart!';
                if (userIsMember) {
                    const payload = { sku: selectedPlan.dataset.sku, __co: [{ "__oid": parseInt(selectedPlan.dataset.oid), "__ov": parseInt(selectedPlan.dataset.vid) }], __q: 1 };
                    await addToCartAPI(payload, isGuest);
                } else if (isPanelSelected) {
                    successMessage = 'Items added to cart!';
                    const panelPayload = { sku: staticProductData.mega_member.sku, __co: [{ "__oid": staticProductData.mega_member.__oid, "__ov": staticProductData.mega_member.__vid }], __q: 1 };
                    await addToCartAPI(panelPayload, isGuest);
                    const planPayload = { sku: selectedPlan.dataset.sku, __co: [{ "__oid": parseInt(selectedPlan.dataset.oid), "__ov": parseInt(selectedPlan.dataset.vid) }], __q: 1 };
                    await addToCartAPI(planPayload, isGuest);
                } else {
                    const payload = { sku: selectedPlan.dataset.sku, __co: [{ "__oid": parseInt(selectedPlan.dataset.oid), "__ov": parseInt(selectedPlan.dataset.vid) }], __q: 1 };
                    await addToCartAPI(payload, isGuest);
                }

                window.showToast(successMessage, 'success');
                if(window.toggleCart) window.toggleCart();

            } catch (error) {
                window.showToast(error.message || 'There was a problem adding items to your cart.', 'error');
            } finally {
                hideButtonSpinner(addToCartBtn, 'Add to Cart');
            }
        });
    });
};


window.kwiltProductUtils.renderAllProducts = async () => { injectStyles(); const container = document.getElementById('slicksliderproduct'); showLoader(container); const allProducts = await fetchProducts(); _renderProductsToDOM(allProducts); };
window.kwiltProductUtils.renderProductsByCategory = async () => { injectStyles(); const container = document.getElementById('slicksliderproduct'); showLoader(container); const categorySlug = (() => { const parts = window.location.pathname.split('/').filter(p => p); return parts.length === 2 && parts[0] === 'category' ? parts[1] : null; })(); if (!categorySlug) { console.warn('No category found in URL.'); _renderProductsToDOM([]); return; } const allProducts = await fetchProducts(); const filteredProducts = allProducts.filter(p => p.category && p.category.some(c => c.toLowerCase().replace(/\s+/g, '-') === categorySlug)); _renderProductsToDOM(filteredProducts); };