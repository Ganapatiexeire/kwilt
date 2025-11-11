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
        .qa-popup { display: none; position: absolute; bottom: 100%; left: 0; background: #F9F5F3; border: 1px solid #EAE0DC; box-shadow: 0 -4px 12px rgba(0,0,0,0.1); z-index: 10; border-radius: 12px; padding: 20px; width: 340px; }
        .qa-container.active .qa-popup { display: block; }

        .qa-options-container { display: flex; flex-direction: column; gap: 10px; }
        .qa-option { background: #F0EBE8; border-radius: 8px; border: 1px solid #EAE0DC; transition: all 0.3s ease; }
        .qa-option.expanded { background: #FFF; }
        .qa-option-header { display: flex; align-items: center; padding: 15px; cursor: pointer; }
        .qa-option-header label { flex-grow: 1; font-weight: 500; color: #452D0F; text-transform: uppercase; }
        .qa-option-header span { font-weight: 500; color: #452D0F; }
        .custom-radio { width: 20px; height: 20px; border: 2px solid #452D0F; border-radius: 50%; margin-right: 15px; position: relative; flex-shrink: 0; }
        .qa-option.selected > .qa-option-header .custom-radio, .qa-sub-option.selected .custom-radio { background: #FF816B; border-color: #FF816B; }
        .qa-option.selected > .qa-option-header .custom-radio::after, .qa-sub-option.selected .custom-radio::after { content: ''; position: absolute; top: 50%; left: 50%; width: 8px; height: 8px; background: white; border-radius: 50%; transform: translate(-50%, -50%); }
        .qa-option-content { display: none; padding: 0 15px 15px; border-top: 1px solid #EAE0DC; margin-top: 10px; }
        .qa-option.expanded .qa-option-content { display: block; }
        .qa-sub-option { display: flex; align-items: center; padding: 10px 0; cursor: pointer; }
        .qa-sub-option label { flex-grow: 1; color: #452D0F; }
        .qa-sub-option span { color: #452D0F; }

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
            <div class="qa-sub-option" data-sku="${o.sku}" data-oid="${o.__oid}" data-vid="${o.__vid}">
                <div class="custom-radio"></div>
                <label>${o.frequency_count} ${o.frequency_unit}</label>
                <span>$${parseFloat(o.monthly_mega_member_installment_price).toFixed(0)}/month</span>
            </div>
        `).join('');
        const nonMemberPlanItems = childOptions.map(o => `
            <div class="qa-sub-option" data-sku="${o.sku}" data-oid="${o.__oid}" data-vid="${o.__vid}">
                <div class="custom-radio"></div>
                <label>${o.frequency_count} ${o.frequency_unit}</label>
                <span>$${parseFloat(o.monthly_installment_price).toFixed(0)}/month</span>
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
                        <button class="button add-tocart-button w-button">ADD TO CART</button>
                        <div class="qa-popup">
                            <div class="qa-options-container">
                                <div class="qa-option member-pricing">
                                    <div class="qa-option-header">
                                        <div class="custom-radio"></div>
                                        <label>MEMBER PRICING</label>
                                        <span>FROM $${childOptions.length > 0 ? parseFloat(childOptions[0].mega_member_installment_price).toFixed(0) : ''}</span>
                                    </div>
                                    <div class="qa-option-content">
                                        ${memberPlanItems}
                                    </div>
                                </div>
                                <div class="qa-option non-member-pricing">
                                    <div class="qa-option-header">
                                        <div class="custom-radio"></div>
                                        <label>NON-MEMBERS</label>
                                        <span>FROM $${childOptions.length > 0 ? parseFloat(childOptions[0].installment_price).toFixed(0) : ''}</span>
                                    </div>
                                    <div class="qa-option-content">
                                        ${nonMemberPlanItems}
                                    </div>
                                </div>
                                ${megaMember ? `
                                <div class="qa-option comprehensive-panel" data-sku="${megaMember.sku}" data-oid="${megaMember.__oid}" data-vid="${megaMember.__vid}">
                                    <div class="qa-option-header">
                                        <div class="custom-radio"></div>
                                        <label>COMPREHENSIVE PANEL</label>
                                        <span>$${parseFloat(megaMember.installment_price).toFixed(0)}/year</span>
                                    </div>
                                </div>
                                ` : ''}
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

        const options = container.querySelectorAll('.qa-option');
        const subOptions = container.querySelectorAll('.qa-sub-option');
        const userIsMember = !!window.memerShip;
        const comprehensivePanel = container.querySelector('.comprehensive-panel');

        if (userIsMember && comprehensivePanel) {
            comprehensivePanel.style.display = 'none';
        }

        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const isMemberPricing = option.classList.contains('member-pricing');
                
                options.forEach(opt => opt.classList.remove('selected', 'expanded'));
                subOptions.forEach(subOpt => subOpt.classList.remove('selected'));

                option.classList.add('selected');
                if (option.querySelector('.qa-option-content')) {
                    option.classList.add('expanded');
                }

                if (!userIsMember && isMemberPricing && comprehensivePanel) {
                    comprehensivePanel.classList.add('selected');
                }
            });
        });

        subOptions.forEach(item => {
            item.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                const parentOption = item.closest('.qa-option');
                if (!parentOption) return;

                parentOption.parentElement.querySelectorAll('.qa-sub-option').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                
                if (!parentOption.classList.contains('selected')) {
                    parentOption.parentElement.querySelectorAll('.qa-option').forEach(i => i.classList.remove('selected', 'expanded'));
                    parentOption.classList.add('selected', 'expanded');
                }

                showButtonSpinner(quickAddBtn);
                const isGuest = !window.authToken;
                const isPanelSelected = comprehensivePanel && comprehensivePanel.classList.contains('selected');

                try {
                    let successMessage = 'Item added to cart!';
                    const planPayload = { sku: item.dataset.sku, __co: [{ "__oid": parseInt(item.dataset.oid), "__ov": parseInt(item.dataset.vid) }], __q: 1 };

                    if (userIsMember) {
                        await addToCartAPI(planPayload, isGuest);
                    } else if (isPanelSelected) {
                        successMessage = 'Items added to cart!';
                        const panelPayload = { sku: comprehensivePanel.dataset.sku, __co: [{ "__oid": parseInt(comprehensivePanel.dataset.oid), "__ov": parseInt(comprehensivePanel.dataset.vid) }], __q: 1 };
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