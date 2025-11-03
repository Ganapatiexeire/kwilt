const API_URL = 'https://kwilt-intake-396730550724.us-central1.run.app/products';

// --- START: Static Data for Quick Add ---
const staticProductData = {
    "child_options": [
        {
            "sku": "membership",
            "product_name": "Semaglutide",
            "subscription_active": true,
            "frequency_count": "28",
            "frequency_unit": "day",
            "installment_price": "249.00",
            "adjustment_price": "0.00",
            "mega_member_installment_price": "225.00",
            "__oid": 55,
            "__vid": 200
        },
        {
            "sku": "sema-12-week",
            "product_name": "Semaglutide",
            "subscription_active": true,
            "frequency_count": "12",
            "frequency_unit": "week",
            "installment_price": "710.00",
            "adjustment_price": "0.00",
            "mega_member_installment_price": "685.00",
            "__oid": 23,
            "__vid": 172
        },
        {
            "sku": "sema-6-month",
            "product_name": "Semaglutide",
            "subscription_active": true,
            "frequency_count": "24",
            "frequency_unit": "week",
            "installment_price": "1345.00",
            "adjustment_price": "0.00",
            "mega_member_installment_price": "1325.00",
            "__oid": 25,
            "__vid": 173
        },
        {
            "sku": "sema-12-month",
            "product_name": "Semaglutide",
            "subscription_active": true,
            "frequency_count": "48",
            "frequency_unit": "week",
            "installment_price": "2540.00",
            "adjustment_price": "0.00",
            "mega_member_installment_price": "2525.00",
            "__oid": 27,
            "__vid": 174
        }
    ],
    "mega_member": {
        "sku": "MEGA-MEMBERSHIP",
        "product_name": "Comprehensive Panel",
        "subscription_active": true,
        "frequency_count": "365",
        "frequency_unit": "day",
        "installment_price": "449.00",
        "adjustment_price": "0.00",
        "mega_member_installment_price": "0.00",
        "__oid": 44,
        "__vid": 201
    }
};
// --- END: Static Data for Quick Add ---

// Create a global object to hold our utility functions
window.kwiltProductUtils = window.kwiltProductUtils || {};

// --- START: Cart Management from product-details.js ---
const CART_API_URL = 'https://kwilt-order-396730550724.us-central1.run.app/nonrx-cart/addItemToCart';
const CART_ID_KEY = '__cid';

const getCartId = () => {
    return localStorage.getItem(CART_ID_KEY);
};

const setCartId = (cartId) => {
    if (cartId) {
        localStorage.setItem(CART_ID_KEY, cartId);
    }
};

const addToCartAPI = async (payload, isGuest) => {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (!isGuest && window.authToken) {
        headers['Authorization'] = `Bearer ${window.authToken}`;
    } else {
        const cartId = getCartId();
        if (cartId) {
            payload.__cid = cartId;
        }
    }

    try {
        const response = await fetch(CART_API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `API request failed with status ${response.status}`);
        }

        if (isGuest && result.data && !getCartId()) {
            setCartId(result.data);
        }

        return result;
    } catch (error) {
        console.error('Add to cart failed:', error);
        throw error;
    }
};
// --- END: Cart Management ---


// --- Start: UI Styles and Helpers ---

const injectStyles = () => {
    if (document.getElementById('kwilt-product-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'kwilt-product-styles';
    style.innerHTML = `
        .kwilt-loader {
            display: block;
            width: 48px;
            height: 48px;
            border: 5px solid #452D0F;
            border-bottom-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 100px auto;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .kwilt-product-container-empty { display: flex; justify-content: center; align-items: center; min-height: 300px; text-align: center; color: #666; font-family: sans-serif; }

        .button-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #fff; border-bottom-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }

        .quick-add-container { position: relative; }

        .quick-add-popup { display: none; position: absolute; bottom: 100%; left: 0; right: 0; background: white; border: 1px solid #eee; box-shadow: 0 -2px 10px rgba(0,0,0,0.1); z-index: 10; }

        .quick-add-container.active .quick-add-popup { display: block; }

        .accordion-item.pricing, .comprehensive-panel { border: 1px solid #e5e5e5; border-radius: 8px; margin-bottom: 10px; overflow: hidden; }

        .accordion-header, .comprehensive-panel { display: flex; justify-content: space-between; align-items: center; padding: 15px; cursor: pointer; }
        
        .cp-col { display: flex; align-items: center; }
        .cp-check, .cp-uncheck { width: 20px; height: 20px; border: 1px solid #ccc; border-radius: 50%; margin-right: 10px; position: relative; }
        
        .accordion-item.selected > .accordion-header .cp-check, .comprehensive-panel.selected .cp-check { background-color: #452D0F; border-color: #452D0F; }
        .accordion-item.selected > .accordion-header .cp-check::after, .comprehensive-panel.selected .cp-check::after { content: ''; position: absolute; top: 5px; left: 5px; width: 8px; height: 8px; border-radius: 50%; background: white; }

        .mp-title { font-weight: bold; }
        .member-pricing-col { text-align: right; }

        .pricing-body-content { display: none; padding: 0 15px 15px; }
        .accordion-item.selected .pricing-body-content { display: block; }

        .plan-item { display: flex; align-items: center; padding: 10px; cursor: pointer; border-top: 1px solid #f0f0f0; }
        .plan-item:first-child { border-top: none; }
        .plan-item.selected { background-color: #f9f9f9; }
        .plan-radio { width: 16px; height: 16px; border: 1px solid #ccc; border-radius: 50%; margin-right: 10px; position: relative; }
        .plan-item.selected .plan-radio { border-color: #452D0F; background-color: #452D0F; }
        .plan-item.selected .plan-radio::after { content: ''; position: absolute; top: 4px; left: 4px; width: 8px; height: 8px; border-radius: 50%; background: white; }
        .plan-details { display: flex; justify-content: space-between; flex-grow: 1; }
        .plan-label { font-weight: bold; }

        .comprehensive-panel { background-color: #f9f9f9; }

        .quick-add-to-cart-btn { margin: 15px; width: calc(100% - 30px); }
    `;
    document.head.appendChild(style);
};

const showLoader = (container) => { if (!container) return; container.innerHTML = '<div class="kwilt-loader"></div>'; container.classList.remove('kwilt-product-container-empty'); };

const showButtonSpinner = (button) => { button.disabled = true; button.style.display = 'flex'; button.style.justifyContent = 'center'; button.style.alignItems = 'center'; button.innerHTML = '<span class="button-spinner"></span>'; };

const hideButtonSpinner = (button, text = 'ADD TO CART') => { button.disabled = false; button.style.display = ''; button.style.justifyContent = ''; button.style.alignItems = ''; button.innerHTML = text; };

// --- End: UI Styles and Helpers ---

const fetchProducts = async () => {
    try {
        const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        if (!response.ok) { throw new Error(`API request failed with status ${response.status}`); }
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
    container.classList.remove('kwilt-product-container-empty');

    if (!products || products.length === 0) { container.innerHTML = '<p>No products found for this category.</p>'; container.classList.add('kwilt-product-container-empty'); return; }

    products.forEach((product, index) => {
        const productElement = document.createElement('div');
        productElement.classList.add('collection-item', 'w-dyn-item', 'w-col', 'w-col-4');
        productElement.setAttribute('role', 'listitem');

        const bestSellerTag = product.bestseller ? `<div class="product-tag list"><div class="product-tag-style fs10">BEST SELLER</div></div>` : '';
        const labRequiredTag = product.labs_required ? `<div class="product-tag list"><img src="https://cdn.prod.website-files.com/6830e308e57fd4713ea17bc9/687e7ec5af2598250628407d_Ellipse%20259.svg" loading="lazy" width="10" height="10" alt=""><div id="dot-mark" class="product-tag-style fs10">LAB REQUIRED</div></div>` : '';

        const memberPlanItems = staticProductData.child_options.map(option => `
            <div class="plan-item" data-sku="${option.sku}" data-oid="${option.__oid}" data-vid="${option.__vid}">
                <div class="plan-radio"></div>
                <div class="plan-details">
                    <div class="plan-label">${option.frequency_count} ${option.frequency_unit}</div>
                    <div class="plan-price">$${parseFloat(option.mega_member_installment_price).toFixed(0)}</div>
                </div>
            </div>`).join('');

        const nonMemberPlanItems = staticProductData.child_options.map(option => `
            <div class="plan-item" data-sku="${option.sku}" data-oid="${option.__oid}" data-vid="${option.__vid}">
                <div class="plan-radio"></div>
                <div class="plan-details">
                    <div class="plan-label">${option.frequency_count} ${option.frequency_unit}</div>
                    <div class="plan-price">$${parseFloat(option.installment_price).toFixed(0)}</div>
                </div>
            </div>`).join('');

        const uniqueId = `product-${index}`;

        productElement.innerHTML = `
            <div class="product-wrap">
                <div class="pl-image">
                    <a href="/product/${product.sku}" class="fullwidth w-inline-block">
                        <img src="${product.thumbnail}" loading="lazy" alt="${product.product_name}" class="image-29">
                        ${labRequiredTag}
                        ${bestSellerTag}
                    </a>
                </div>
                <div class="pl-content">
                    <div class="product-name">${product.product_name}</div>
                    <div class="pl-meta">$${product.lowest_price}/mo</div>
                    <div class="quick-add-container" id="${uniqueId}">
                        <button class="button add-tocart-button w-button">ADD TO CART</button>
                        <div class="quick-add-popup">
                            <div id="member-pricing-accord" class="accordion-item pricing">
                                <div class="accordion-header"><div class="cp-col"><div class="cp-check"></div><div class="mp-title">Member Pricing</div></div><div class="member-pricing-col"><div class="mp-price-style member-price">from $${parseFloat(staticProductData.child_options[0].mega_member_installment_price).toFixed(0)}</div></div></div>
                                <div class="pricing-body-content">${memberPlanItems}</div>
                            </div>
                            <div id="non-member-accord" class="accordion-item pricing">
                                <div class="accordion-header"><div class="cp-col"><div class="cp-check"></div><div class="mp-title">Non member</div></div><div class="member-pricing-col"><div class="mp-price-style non-member-price">from $${parseFloat(staticProductData.child_options[0].installment_price).toFixed(0)}</div></div></div>
                                <div class="pricing-body-content">${nonMemberPlanItems}</div>
                            </div>
                            <div class="comprehensive-panel"><div class="cp-col"><div class="cp-check"></div><div class="cp-title-col"><div class="cp-title">Comprehensive Panel</div></div></div><div class="price-col"><div class="cp-price">$${parseFloat(staticProductData.mega_member.installment_price).toFixed(0)}/year</div></div></div>
                            <button class="button quick-add-to-cart-btn w-button">Add to Cart</button>
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
    const containers = document.querySelectorAll('.quick-add-container');

    containers.forEach(container => {
        const quickAddBtn = container.querySelector('.add-tocart-button');
        let leaveTimeout;

        quickAddBtn.addEventListener('mouseenter', () => {
            clearTimeout(leaveTimeout);
            quickAddBtn.textContent = 'QUICK ADD';
            container.classList.add('active');
        });

        container.addEventListener('mouseleave', () => {
            leaveTimeout = setTimeout(() => {
                quickAddBtn.textContent = 'ADD TO CART';
                container.classList.remove('active');
            }, 200);
        });

        container.addEventListener('mouseenter', () => {
            clearTimeout(leaveTimeout);
        });

        quickAddBtn.addEventListener('click', (e) => {
            e.preventDefault();
            container.classList.toggle('active');
        });

        const memberAccordion = container.querySelector('#member-pricing-accord');
        const nonMemberAccordion = container.querySelector('#non-member-accord');
        const comprehensivePanel = container.querySelector('.comprehensive-panel');
        const allPlanItems = container.querySelectorAll('.plan-item');
        const addToCartBtn = container.querySelector('.quick-add-to-cart-btn');

        memberAccordion.querySelector('.accordion-header').addEventListener('click', () => {
            memberAccordion.classList.add('selected');
            nonMemberAccordion.classList.remove('selected');
            if (!window.memerShip) comprehensivePanel.classList.add('selected');
        });

        nonMemberAccordion.querySelector('.accordion-header').addEventListener('click', () => {
            nonMemberAccordion.classList.add('selected');
            memberAccordion.classList.remove('selected');
            comprehensivePanel.classList.remove('selected');
        });

        comprehensivePanel.addEventListener('click', () => {
            if (window.memerShip) return;
            comprehensivePanel.classList.toggle('selected');
            if (comprehensivePanel.classList.contains('selected')) {
                memberAccordion.classList.add('selected');
                nonMemberAccordion.classList.remove('selected');
            }
        });

        allPlanItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                allPlanItems.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
            });
        });

        addToCartBtn.addEventListener('click', async () => {
            const selectedPlan = container.querySelector('.plan-item.selected');
            if (!selectedPlan) { window.showToast('Please select a plan.', 'error'); return; }

            showButtonSpinner(addToCartBtn);
            const isGuest = !window.authToken;
            const isPanelSelected = comprehensivePanel.classList.contains('selected');

            try {
                let successMessage = 'Item added to cart!';
                if (window.memerShip) {
                    const payload = { sku: selectedPlan.dataset.sku, __co: [{ "__oid": parseInt(selectedPlan.dataset.oid), "__ov": parseInt(selectedPlan.dataset.vid) }], __q: 1 };
                    const result = await addToCartAPI(payload, isGuest);
                    if (!result || !result.success) throw new Error(result ? result.message : 'Could not add item to cart.');
                } else if (isPanelSelected) {
                    successMessage = 'Items added to cart!';
                    const panelPayload = { sku: staticProductData.mega_member.sku, __co: [{ "__oid": staticProductData.mega_member.__oid, "__ov": staticProductData.mega_member.__vid }], __q: 1 };
                    const panelResult = await addToCartAPI(panelPayload, isGuest);
                    if (!panelResult || !panelResult.success) throw new Error(panelResult ? panelResult.message : 'Could not add Comprehensive Panel.');
                    
                    const planPayload = { sku: selectedPlan.dataset.sku, __co: [{ "__oid": parseInt(selectedPlan.dataset.oid), "__ov": parseInt(selectedPlan.dataset.vid) }], __q: 1 };
                    const planResult = await addToCartAPI(planPayload, isGuest);
                    if (!planResult || !planResult.success) throw new Error(planResult ? planResult.message : 'Could not add selected plan.');
                } else {
                    const payload = { sku: selectedPlan.dataset.sku, __co: [{ "__oid": parseInt(selectedPlan.dataset.oid), "__ov": parseInt(selectedPlan.dataset.vid) }], __q: 1 };
                    const result = await addToCartAPI(payload, isGuest);
                    if (!result || !result.success) throw new Error(result ? result.message : 'Could not add item to cart.');
                }

                window.showToast(successMessage, 'success');
                if(window.toggleCart) window.toggleCart();

            } catch (error) {
                console.error(error);
                window.showToast(error.message || 'There was a problem adding items to your cart.', 'error');
            } finally {
                hideButtonSpinner(addToCartBtn, 'Add to Cart');
            }
        });
    });
};

const normalizeCategory = (category) => { if (typeof category !== 'string') return ''; return category.toLowerCase().replace(/\s+/g, '-'); };

const getCategoryFromPath = () => { const pathParts = window.location.pathname.split('/').filter(part => part); if (pathParts.length === 2 && pathParts[0] === 'category') { return pathParts[1]; } return null; };

window.kwiltProductUtils.renderAllProducts = async () => { injectStyles(); const container = document.getElementById('slicksliderproduct'); showLoader(container); const allProducts = await fetchProducts(); _renderProductsToDOM(allProducts); };

window.kwiltProductUtils.renderProductsByCategory = async () => { injectStyles(); const container = document.getElementById('slicksliderproduct'); showLoader(container); const categorySlug = getCategoryFromPath(); if (!categorySlug) { console.warn('No category found in the URL path. Cannot render category products.'); _renderProductsToDOM([]); return; } const allProducts = await fetchProducts(); const filteredProducts = allProducts.filter(product => product.category && product.category.some(cat => normalizeCategory(cat) === categorySlug)); _renderProductsToDOM(filteredProducts); };