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
        .qa-popup { display: none; position: absolute; bottom: 100%; left: 0; background: #FFFFFF; border: 1px solid #EAE0DC; box-shadow: 0 -4px 12px rgba(0,0,0,0.1); z-index: 10; border-radius: 12px; width: 340px; overflow: hidden; font-family: sans-serif; }
        .qa-container.active .qa-popup { display: block; }

        .qa-accordion, .qa-panel { padding: 20px; cursor: pointer; border-bottom: 1px solid #aeaeae; background-color: #E0DDDD; }
        .qa-panel { background-color: #FFFBEB; }
        .qa-accordion:last-of-type, .qa-panel:last-of-type, .qa-accordion + .qa-panel { border-bottom: none; }

        .qa-accordion-header, .qa-panel-header { display: flex; align-items: center; justify-content: space-between; }
        .qa-header-content { display: flex; align-items: center; }
        
        .qa-radio { width: 20px; height: 20px; border: 1.5px solid #452D0F; border-radius: 50%; margin-right: 15px; flex-shrink: 0; box-sizing: border-box; }
        .qa-accordion.selected > .qa-accordion-header .qa-radio, .qa-panel.selected .qa-radio, .qa-plan-item.selected .qa-radio { background-color: #FF816B; border-color: #FF816B; }

        .qa-accordion-title, .qa-panel-title { font-weight: 500; color: #452D0F; text-transform: uppercase; font-size: 16px; }
        .qa-accordion-price, .qa-panel-price { font-weight: 500; color: #452D0F; font-size: 16px; }

        .qa-plan-list { display: none; padding-left: 15px; margin-top: 15px; }
        .qa-accordion.selected .qa-plan-list { display: block; }

        .qa-plan-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #AEAEAE; }
        .qa-plan-item:last-child { border-bottom: none; }
        .qa-plan-selection { display: flex; align-items: center; }
        .qa-plan-label { color: #452D0F; font-weight: 400; font-size: 16px; }
        .qa-plan-price { color: #452D0F; font-weight: 400; font-size: 16px; }

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
        .product-prescription{
            min-height: 20px;
            line-height: 20px; 
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

        const labRequiredTag = product.labs_required.length > 0 ? `
            <div id="labs-required" class="product-tag" style="display: block;"><div id="dot-mark" class="product-tag-style">LAB REQUIRED</div></div>
        ` : '';

        productElement.innerHTML = `
            <div class="product-wrap">
                <div class="pl-image"><a href="/product/${product.sku}" class="fullwidth w-inline-block"><img src="${product.thumbnail}" loading="lazy" alt="${product.product_name}" class="image-29">${labRequiredTag}</a></div>
                <div class="pl-content">
                    <div class="product-name">${product.product_name}</div>
                    <div class="pl-meta product-prescription">${product.prescription || ''}</div>
                    <div class="pl-meta">$${(+product.lowest_price || 0).toFixed(0)}/mo</div>
                    <div class="qa-container" id="qa-container-${index}">
                        <a href="/product/${product.sku}" class="button add-tocart-button w-button">ADD TO CART</a>
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
                            ${megaMember ? `
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
    const allContainers = document.querySelectorAll('.qa-container');

    // Helper function to reset the internal state of a popup
    const resetPopupState = (container) => {
        if (container) {
            container.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        }
    };

    // Global click listener to close any open/clicked popups
    document.body.addEventListener('click', (e) => {
        allContainers.forEach(container => {
            if (!container.contains(e.target)) {
                if (container.classList.contains('active')) {
                    resetPopupState(container);
                }
                container.classList.remove('active', 'clicked');
            }
        });
    });

    allContainers.forEach(container => {
        const quickAddBtn = container.querySelector('.add-tocart-button');
        const popup = container.querySelector('.qa-popup');

        const openPopup = () => {
            // 1. Only one popup at a time: Close and reset all others
            allContainers.forEach(c => {
                if (c !== container) {
                    if (c.classList.contains('active')) {
                       resetPopupState(c);
                    }
                    c.classList.remove('active', 'clicked');
                }
            });
            // Open the current one
            popup.style.width = `${quickAddBtn.offsetWidth}px`;
            container.classList.add('active');
        };

        container.addEventListener('mouseenter', openPopup);

        container.addEventListener('mouseleave', () => {
            if (!container.classList.contains('clicked')) {
                container.classList.remove('active');
                // 2. Reset data if popup is closed
                resetPopupState(container);
            }
        });

        quickAddBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (container.classList.contains('clicked')) {
                container.classList.remove('clicked');
                resetPopupState(container);
            } else {
                openPopup(); // Ensure it's open and others are closed
                container.classList.add('clicked');
            }
        });

        const accordions = container.querySelectorAll('.qa-accordion');
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

                if (isAccordion && option.classList.contains('selected')) {
                    option.classList.remove('selected');
                    // Also deselect child plan items
                    option.querySelectorAll('.qa-plan-item.selected').forEach(pi => pi.classList.remove('selected'));
                    return;
                }

                allOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');

                if (!userIsMember && isMemberPricing && panel) {
                    panel.classList.add('selected');
                } else if (!isMemberPricing && panel) {
                    panel.classList.remove('selected');
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
                    allOptions.forEach(i => i.classList.remove('selected'));
                    parentAccordion.classList.add('selected');
                     if (!userIsMember && parentAccordion.classList.contains('member-pricing') && panel) {
                        panel.classList.add('selected');
                    }
                }

                showButtonSpinner(quickAddBtn);
                const isGuest = !window.authToken;
                const isPanelSelected = panel && panel.classList.contains('selected');

                try {
                    let successMessage = 'Item added to cart!';
                    const planPayload = { sku: item.dataset.sku, __co: [{ "__oid": parseInt(item.dataset.oid), "__ov": parseInt(item.dataset.vid) }], __q: 1 };

                    if (userIsMember) {
                        await addToCartAPI(planPayload, isGuest);
                    } else if (isPanelSelected) {
                        successMessage = 'Items added to cart!';
                        const panelPayload = { sku: panel.dataset.sku, __co: [{ "__oid": parseInt(panel.dataset.oid), "__ov": parseInt(panel.dataset.vid) }], __q: 1 };
                        await addToCartAPI(panelPayload, isGuest);
                        await addToCartAPI(planPayload, isGuest);
                    } else {
                        await addToCartAPI(planPayload, isGuest);
                    }

                    window.showToast(successMessage, 'success');
                    if(window.toggleCart) window.toggleCart();
                } catch (error) {
                    window.showToast(error.message || 'There was a problem adding items to your cart.', 'error');
                } finally {
                    hideButtonSpinner(quickAddBtn, 'ADD TO CART');
                    container.classList.remove('active', 'clicked');
                    // 3. Reset data after adding to cart
                    resetPopupState(container);
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