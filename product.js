const API_URL = 'https://kwilt-intake-396730550724.us-central1.run.app/products';



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
        .qa-popup { display: none; position: absolute; bottom: 100%; left: 0; background: #fff; border: 1px solid #e0e0e0; box-shadow: 0 -4px 12px rgba(0,0,0,0.1); z-index: 10; border-radius: 8px; padding: 15px; }
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

        .qa-header-content { display: flex; align-items: center; flex-grow: 1; }

        .qa-radio { width: 20px; height: 20px; border: 1.5px solid #452d0f; border-radius: 50%; margin-right: 12px; flex-shrink: 0; position: relative; }
        .qa-accordion.selected > .qa-accordion-header .qa-radio, .qa-panel.selected .qa-radio, .qa-plan-item.selected .qa-radio {
            background-color: #452d0f;
        }
        .qa-accordion.selected > .qa-accordion-header .qa-radio::after, .qa-panel.selected .qa-radio::after, .qa-plan-item.selected .qa-radio::after {
            content: ''; position: absolute; top: 50%; left: 50%; width: 8px; height: 8px; background: white; border-radius: 50%; transform: translate(-50%, -50%);
        }

        .qa-accordion-title, .qa-panel-title { font-weight: 500; text-transform: uppercase; font-size: 14px; }
        .qa-accordion-price, .qa-panel-price { font-size: 14px; }

        .qa-plan-list { display: none; padding: 5px 10px 10px; border-top: 1px solid #e0dcdc; margin-top: 10px; }
        .qa-accordion.selected .qa-plan-list { display: block; }

        .qa-plan-item { display: flex; justify-content: space-between; align-items: center; padding: 8px; cursor: pointer; border-radius: 4px; }
        .qa-plan-item:hover { background-color: #ede3e0; }
        .qa-plan-selection { display: flex; align-items: center; }
        .qa-plan-label { font-size: 14px; }
        .qa-plan-price { font-size: 14px; }

        .pl-image { position: relative; }
        .product-tag.list {
            position: absolute;
            top: 10px;
            left: 10px;
            background-color: rgba(255, 255, 255, 0.8);
            padding: 5px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            color: #333;
            z-index: 1;
        }
        
        div#dot-mark:before, .dot-mark:before {
            content: '';
            width: 14px;
            height: 14px;
            background: #FF816B;
            display: block;
            border-radius: 30px;
        }
        div#dot-mark {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
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

    const offset = 200;
    const elementPosition = container.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });

    container.innerHTML = '';

    if (!products || products.length === 0) {
        container.innerHTML = '<p>No products found.</p>';
        // Braze Tracking for empty product view
        if (window.trackEvent) {
            const eventProperties = {
                total_products: 0,
                categories: [],
                timestamp: new Date().toISOString()
            };
            window.trackEvent('product_listing_viewed', eventProperties);
            console.log('Braze event fired: product_listing_viewed (empty)', eventProperties);
        }
        return;
    }

    products.forEach((product, index) => {
        const productElement = document.createElement('div');
        productElement.classList.add('collection-item', 'w-dyn-item', 'w-col', 'w-col-4');

        const childOptions = product.child_options || [];
        const megaMember = product.mega_member;

        const memberPlanItems = childOptions.map(o => `<div class="qa-plan-item" data-sku="${o.sku}" data-oid="${o.__oid}" data-vid="${o.__vid}"><div class="qa-plan-selection"><div class="qa-radio"></div><div class="qa-plan-label">${o.frequency_count} ${o.frequency_unit}</div></div><div class="qa-plan-price">$${parseFloat(o.monthly_mega_member_installment_price).toFixed(0)}</div></div>`).join('');
        const nonMemberPlanItems = childOptions.map(o => `<div class="qa-plan-item" data-sku="${o.sku}" data-oid="${o.__oid}" data-vid="${o.__vid}"><div class="qa-plan-selection"><div class="qa-radio"></div><div class="qa-plan-label">${o.frequency_count} ${o.frequency_unit}</div></div><div class="qa-plan-price">$${parseFloat(o.monthly_installment_price).toFixed(0)}</div></div>`).join('');

        const labRequiredTag = product.labs_required.length > 0 ? `
            <div id="labs-required" class="product-tag" style="display: block;"><div id="dot-mark" class="product-tag-style">LAB REQUIRED</div></div>
        ` : '';

        productElement.innerHTML = `
            <div class="product-wrap">
                <div class="pl-image"><a href="/product/${product.sku}" class="fullwidth w-inline-block"><img src="${product.thumbnail}" loading="lazy" alt="${product.product_name}" class="image-29">${labRequiredTag}</a></div>
                <div class="pl-content">
                    <div class="product-name">${product.product_name}</div>
                    <div class="pl-meta">$${(+product.lowest_price || 0).toFixed(0)}/mo</div>
                    <div class="qa-container" id="qa-container-${index}">
                        <button class="button add-tocart-button w-button">ADD TO CART</button>
                        <div class="qa-popup">
                            <div class="qa-accordion" id="qa-member-pricing-accord">
                                <div class="qa-accordion-header"><div class="qa-header-content"><div class="qa-radio"></div><div class="qa-accordion-title">Member Pricing</div></div><div class="qa-accordion-price">from $${childOptions.length > 0 ? parseFloat(childOptions[0].mega_member_installment_price).toFixed(0) : ''}</div></div>
                                <div class="qa-plan-list">${memberPlanItems}</div>
                            </div>
                            <div class="qa-accordion" id="qa-non-member-accord">
                                <div class="qa-accordion-header"><div class="qa-header-content"><div class="qa-radio"></div><div class="qa-accordion-title">Non-Member</div></div><div class="qa-accordion-price">from $${childOptions.length > 0 ? parseFloat(childOptions[0].installment_price).toFixed(0) : ''}</div></div>
                                <div class="qa-plan-list">${nonMemberPlanItems}</div>
                            </div>
                            <div class="qa-panel" id="qa-comprehensive-panel" data-sku="${megaMember ? megaMember.sku : ''}" data-oid="${megaMember ? megaMember.__oid : ''}" data-vid="${megaMember ? megaMember.__vid : ''}">
                                <div class="qa-panel-header"><div class="qa-header-content"><div class="qa-radio"></div><div class="qa-panel-title">Comprehensive Panel</div></div><div class="qa-panel-price">$${megaMember ? parseFloat(megaMember.installment_price).toFixed(0) : ''}/year</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(productElement);
    });
    setupQuickAddListeners();

    // Braze Tracking: Product Listing Viewed
    if (window.trackEvent) {
        const categories = [...new Set(products.flatMap(p => p.category || []))];
        const eventProperties = {
            total_products: products.length,
            categories: categories,
            timestamp: new Date().toISOString()
        };
        window.trackEvent('product_listing_viewed', eventProperties);
        console.log('Braze event fired: product_listing_viewed', eventProperties);
    }
};

const setupQuickAddListeners = () => {
    const containers = document.querySelectorAll('.qa-container');

    document.body.addEventListener('click', (e) => {
        containers.forEach(container => {
            if (!container.contains(e.target)) {
                container.classList.remove('active', 'clicked');
                container.querySelector('.add-tocart-button').textContent = 'ADD TO CART';
            }
        });
    });

    containers.forEach(container => {
        const quickAddBtn = container.querySelector('.add-tocart-button');
        const popup = container.querySelector('.qa-popup');

        quickAddBtn.addEventListener('mouseenter', () => {
            quickAddBtn.textContent = 'QUICK ADD';
            popup.style.width = `${quickAddBtn.offsetWidth}px`;
            container.classList.add('active');
        });

        container.addEventListener('mouseleave', () => {
             if (!container.classList.contains('clicked')) {
                container.classList.remove('active');
                quickAddBtn.textContent = 'ADD TO CART';
            }
        });

        quickAddBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            container.classList.toggle('clicked');
            container.classList.add('active');
        });

        const memberAccordion = container.querySelector('#qa-member-pricing-accord');
        const nonMemberAccordion = container.querySelector('#qa-non-member-accord');
        const comprehensivePanel = container.querySelector('#qa-comprehensive-panel');
        const allPlanItems = container.querySelectorAll('.qa-plan-item');

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
        }

        memberAccordion.addEventListener('click', selectMemberPricing);
        nonMemberAccordion.addEventListener('click', selectNonMemberPricing);
        comprehensivePanel.addEventListener('click', () => { if (!userIsMember) selectMemberPricing(); });

        allPlanItems.forEach(item => {
            item.addEventListener('click', async (e) => {
                e.stopPropagation();
                const parentAccordion = item.closest('.qa-accordion');
                if (!parentAccordion) return;

                // Visually select the item
                container.querySelectorAll('.qa-plan-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');

                // Braze Tracking: Add to Cart Attempted
                if (window.trackEvent) {
                    const productElement = item.closest('.product-wrap');
                    const productName = productElement.querySelector('.product-name').textContent;
                    const isPanelSelected = comprehensivePanel.classList.contains('selected');
                    const eventProperties = {
                        product_id: item.dataset.sku,
                        product_name: productName,
                        price: parseFloat(item.querySelector('.qa-plan-price').textContent.replace('$', '')),
                        purchase_option: parentAccordion.id === 'qa-member-pricing-accord' ? 'member' : 'non-member',
                        comprehensive_panel_selected: isPanelSelected,
                        timestamp: new Date().toISOString()
                    };
                    window.trackEvent('add_to_cart_attempted', eventProperties);
                    console.log('Braze event fired: add_to_cart_attempted', eventProperties);
                }

                // Trigger selection logic for parent accordion
                if (parentAccordion.id === 'qa-member-pricing-accord') selectMemberPricing();
                else selectNonMemberPricing();

                showButtonSpinner(quickAddBtn);
                const isGuest = !window.authToken;
                const isPanelSelected = comprehensivePanel.classList.contains('selected');

                try {
                    let successMessage = 'Item added to cart!';
                    if (userIsMember) {
                        const payload = { sku: item.dataset.sku, __co: [{ "__oid": parseInt(item.dataset.oid), "__ov": parseInt(item.dataset.vid) }], __q: 1 };
                        await addToCartAPI(payload, isGuest);
                    } else if (isPanelSelected) {
                        successMessage = 'Items added to cart!';
                        const panelPayload = { sku: comprehensivePanel.dataset.sku, __co: [{ "__oid": parseInt(comprehensivePanel.dataset.oid), "__ov": parseInt(comprehensivePanel.dataset.vid) }], __q: 1 };
                        await addToCartAPI(panelPayload, isGuest);

                        // Braze Tracking: Comprehensive Panel Added
                        if (window.trackEvent) {
                            const eventProperties = {
                                product_id: comprehensivePanel.dataset.sku,
                                timestamp: new Date().toISOString()
                            };
                            window.trackEvent('comprehensive_panel_added', eventProperties);
                            console.log('Braze event fired: comprehensive_panel_added', eventProperties);
                        }

                        const planPayload = { sku: item.dataset.sku, __co: [{ "__oid": parseInt(item.dataset.oid), "__ov": parseInt(item.dataset.vid) }], __q: 1 };
                        await addToCartAPI(planPayload, isGuest);
                    } else {
                        const payload = { sku: item.dataset.sku, __co: [{ "__oid": parseInt(item.dataset.oid), "__ov": parseInt(item.dataset.vid) }], __q: 1 };
                        await addToCartAPI(payload, isGuest);
                    }

                    // Braze Tracking: Add to Cart Success
                    if (window.trackEvent) {
                        const eventProperties = {
                            product_id: item.dataset.sku,
                            cart_id: getCartId(),
                            timestamp: new Date().toISOString()
                        };
                        window.trackEvent('add_to_cart_success', eventProperties);
                        console.log('Braze event fired: add_to_cart_success', eventProperties);
                    }

                    window.showToast(successMessage, 'success');
                    if(window.toggleCart) window.toggleCart();
                } catch (error) {
                    // Braze Tracking: Add to Cart Failed
                    if (window.trackEvent) {
                        const eventProperties = {
                            product_id: item.dataset.sku,
                            reason: error.message || 'Unknown error',
                            timestamp: new Date().toISOString()
                        };
                        window.trackEvent('add_to_cart_failed', eventProperties);
                        console.log('Braze event fired: add_to_cart_failed', eventProperties);
                    }

                    window.showToast(error.message || 'There was a problem adding items to your cart.', 'error');
                } finally {
                    hideButtonSpinner(quickAddBtn, 'ADD TO CART');
                    container.classList.remove('active', 'clicked');
                }
            });
        });
    });
};


window.kwiltProductUtils.renderAllProducts = async() =>{
  injectStyles();
  const container = document.getElementById('slicksliderproduct');
  showLoader(container);
  const allProducts = await fetchProducts();
  _renderProductsToDOM(allProducts);
};
window.kwiltProductUtils.renderProductsByCategory = async() =>{
  injectStyles();
  const container = document.getElementById('slicksliderproduct');
  showLoader(container);
  const categorySlug = (() =>{
    const parts = window.location.pathname.split('/').filter(p =>p);
    return parts.length === 2 && parts[0] === 'category' ? parts[1] : null;
  })();
  if (!categorySlug) {
    console.warn('No category found in URL.');
    _renderProductsToDOM([]);
    return;
  }
  const allProducts = await fetchProducts();
  const filteredProducts = allProducts.filter(p =>p.category && p.category.some(c =>c.toLowerCase().replace(/\s+/g, '-') === categorySlug));
  _renderProductsToDOM(filteredProducts);
};