
const API_BASE_URL = 'https://kwilt-intake-396730550724.us-central1.run.app/product-info'

const injectLoaderStyles = () => {
    if (document.getElementById('kwilt-product-detail-styles')) return;
    const style = document.createElement('style');
    style.id = 'kwilt-product-detail-styles';
    style.innerHTML = `
        .kwilt-pd-loader-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.8); display: flex; justify-content: center; align-items: center; z-index: 10; min-height: 300px; }
        .kwilt-pd-loader { display: block; width: 48px; height: 48px; border: 5px solid #452D0F; border-bottom-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* NEW: Button Spinner Styles */
        .button-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #fff; /* White spinner */
            border-bottom-color: transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        /* --- STYLES FOR STATE MANAGEMENT --- */
        .accordion-item .accordion-content, .accordion-item .pricing-body-content { display: none; }
        .accordion-item.pricing .cp-check { display: none; }
        .accordion-item.pricing .cp-uncheck { display: block; }
        .accordion-item.pricing.selected .pricing-body-content { display: block; }
        .accordion-item.pricing.selected .cp-check { display: block; }
        .accordion-item.pricing.selected .cp-uncheck { display: none; }
        .comprehensive-panel .cp-check { display: none; }
        .comprehensive-panel .cp-uncheck { display: block; }
        .comprehensive-panel.selected .cp-check { display: block; }
        .comprehensive-panel.selected .cp-uncheck { display: none; }
        .accordion-item.open .accordion-content { display: block; }
    `;
    document.head.appendChild(style);
};

var showDetailsLoader = (container) => {
    if (!container) return;
    container.innerHTML = ''; // Clear existing content for loader
    const overlay = document.createElement('div');
    overlay.className = 'kwilt-pd-loader-overlay';
    overlay.innerHTML = '<div class="kwilt-pd-loader"></div>';
    container.style.position = 'relative';
    container.appendChild(overlay);
};

var hideDetailsLoader = (container) => {
    if (!container) return;
    const overlay = container.querySelector('.kwilt-pd-loader-overlay');
    if (overlay) {
        overlay.remove();
    }
    container.style.position = '';
};

// --- NEW: Button Spinner Helpers ---
const showButtonSpinner = (button) => {
    button.disabled = true;
    button.style.display = 'flex';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';
    button.innerHTML = '<span class="button-spinner"></span>';
};

const hideButtonSpinner = (button) => {
    button.disabled = false;
    button.style.display = '';
    button.style.justifyContent = '';
    button.style.alignItems = '';
    button.innerHTML = 'Add To Cart';
};

const fetchProductDetails = async (sku) => {
    if (!sku) {
        console.error('No SKU provided.');
        return null;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/${sku}`);
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        const data = await response.json();
        return data.data || null;
    } catch (error) {
        console.error('Error fetching product details:', error);
        return null;
    }
};

const renderMainInfo = (product) => {
    document.querySelector('.name-product').textContent = product.product_name || 'Product Name';
    document.querySelector('.product-descrition').textContent = product.short_description || 'No description available.';
    document.querySelector('.pd-img').src = product.image || 'https://cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg';
};
const renderTags = (product) => {
    const labsRequiredTag = document.getElementById('labs-required');
    const bestSellerTag = document.getElementById('best-seller');
    if (labsRequiredTag) {
        labsRequiredTag.style.display = product.labs_required ? 'block' : 'none';
    }
    if (bestSellerTag) {
        bestSellerTag.style.display = 'none';
    }
};
const renderPricing = (product) => {
    const { child_options = [] } = product;
    const memberPriceContainer = document.querySelector('#member-pricing-accord .pricing-body-content');
    const memberPriceHeader = document.querySelector('#member-pricing-accord .member-price');
    if (memberPriceContainer && memberPriceHeader) {
        const memberPrices = child_options.map(p => parseFloat(p.mega_member_installment_price)).filter(p => !isNaN(p));
        const lowestMemberPrice = memberPrices.length > 0 ? Math.min(...memberPrices) : 0;
        memberPriceHeader.textContent = `from $${lowestMemberPrice.toFixed(0)}`;
        renderPlanOptions(memberPriceContainer, child_options, 'mega_member_installment_price', true);
    }
    const nonMemberPriceContainer = document.querySelector('#non-member-accord .pricing-body-content');
    const nonMemberPriceHeader = document.querySelector('#non-member-accord .non-member-price');
    if (nonMemberPriceContainer && nonMemberPriceHeader) {
        const nonMemberPrices = child_options.map(p => parseFloat(p.installment_price)).filter(p => !isNaN(p));
        const lowestNonMemberPrice = nonMemberPrices.length > 0 ? Math.min(...nonMemberPrices) : 0;
        nonMemberPriceHeader.textContent = `from $${lowestNonMemberPrice.toFixed(0)}`;
        renderPlanOptions(nonMemberPriceContainer, child_options, 'installment_price', false);
    }
};
const renderPlanOptions = (container, options, priceKey, isMember) => {
    container.innerHTML = '';
    options.forEach((option, index) => {
        const planItem = document.createElement('div');
        planItem.className = 'plan-item';
        // if (index === 0) {
        //     planItem.classList.add('selected');
        // }
        const price = parseFloat(option[priceKey]).toFixed(0);
        const label = `${option.frequency_count} ${option.frequency_unit}`;
        planItem.innerHTML = `
            <div class="plan-radio"></div>
            <div class="plan-details">
                <div class="plan-label">${label}</div>
                <div class="plan-price">$${price}</div>
            </div>
        `;
        planItem.dataset.sku = option.sku;
        planItem.dataset.price = price;
        planItem.dataset.label = label;
        planItem.dataset.isMember = isMember;
        planItem.dataset.oid = option.__oid;
        planItem.dataset.vid = option.__vid;
        container.appendChild(planItem);
    });
};
const renderComprehensivePanel = (product) => {
    const panelPrice = document.querySelector('.comprehensive-panel .cp-price');
    if (panelPrice && product.mega_member) {
        const price = parseFloat(product.mega_member.installment_price).toFixed(0);
        panelPrice.textContent = `$${price}/year`;
    }
};
// const renderContentAccordions = () => {
//     const accordions = document.querySelectorAll('.accordion-wrapper .accordion-content');
//     accordions.forEach(acc => {
//         acc.innerHTML = '<p>Details not available.</p>';
//     });
// };


// --- NEW: Cart Management and API Layer ---
const CART_API_URL = 'https://kwilt-order-396730550724.us-central1.run.app/nonrx-cart/addItemToCart';
const CART_ID_KEY = '__cid';

/**
 * Retrieves the guest cart ID from localStorage.
 * @returns {string|null}
 */
const getCartId = () => {
    return localStorage.getItem(CART_ID_KEY);
};

/**
 * Saves the guest cart ID to localStorage.
 * @param {string} cartId
 */
const setCartId = (cartId) => {
    if (cartId) {
        localStorage.setItem(CART_ID_KEY, cartId);
    }
};

/**
 * Handles the actual API call to add an item to the cart.
 * @param {object} payload - The data to send to the API.
 * @param {boolean} isGuest - Flag to determine if the user is a guest.
 * @returns {Promise<object>}
 */
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

        // If it's a guest and a new cart ID is returned, save it.
        if (isGuest && result.data && !getCartId()) {
            setCartId(result.data);
        }

        return result;
    } catch (error) {
        console.error('Add to cart failed:', error);
        throw error; // Re-throw the error to be handled by the caller
    }
};


// --- NEW Global Object and State Management ---
window.kwiltProductDetailsUtils = {
    updateUI: () => {
        const authToken = window.authToken || null;
        const memerShip = window.memerShip || false;
        const userState = {
            isLoggedIn: !!authToken,
            isMember: memerShip,
        };

        const comprehensivePanel = document.querySelector('.comprehensive-panel');
        if (comprehensivePanel) {
            comprehensivePanel.style.display = (userState.isLoggedIn && userState.isMember) ? 'none' : 'flex';
        }
    }
};

// --- Event Listeners and Interactivity ---
const setupEventListeners = (userState, productData) => {
    const pricingAccordions = document.querySelectorAll('.accordion-item.pricing');
    const contentAccordions = document.querySelectorAll('.accordion-wrapper .accordion-item');
    const addToCartButton = document.getElementById('add-to-cart');
    const comprehensivePanel = document.querySelector('.comprehensive-panel');
    const memberAccordion = document.getElementById('member-pricing-accord');
    const nonMemberAccordion = document.getElementById('non-member-accord');
    const allPlanItems = document.querySelectorAll('.plan-item');

    // --- State Machine for Pricing Selection ---
    if (memberAccordion) {
        memberAccordion.querySelector('.accordion-header').addEventListener('click', () => {
            if (memberAccordion.classList.contains('selected') && !comprehensivePanel.classList.contains('selected')) return;
            nonMemberAccordion.classList.remove('selected');
            memberAccordion.classList.add('selected');
            if (!userState.isMember) {
                comprehensivePanel.classList.add('selected');
            } else {
                comprehensivePanel.classList.remove('selected');
            }
            allPlanItems.forEach(item => item.classList.remove('selected'));
            let selectedPlan = null;
            if (lastSelectedPlanLabel) {
                selectedPlan = Array.from(memberAccordion.querySelectorAll('.plan-item')).find(item => item.dataset.label === lastSelectedPlanLabel);
            }
            if (selectedPlan) {
                selectedPlan.classList.add('selected');
            } else {
                const firstMemberPlan = memberAccordion.querySelector('.plan-item');
                if (firstMemberPlan) firstMemberPlan.classList.add('selected');
            }
        });
    }
    if (nonMemberAccordion) {
        nonMemberAccordion.querySelector('.accordion-header').addEventListener('click', () => {
            if (nonMemberAccordion.classList.contains('selected')) return;
            comprehensivePanel.classList.remove('selected');
            memberAccordion.classList.remove('selected');
            nonMemberAccordion.classList.add('selected');
            allPlanItems.forEach(item => item.classList.remove('selected'));
            let selectedPlan = null;
            if (lastSelectedPlanLabel) {
                selectedPlan = Array.from(nonMemberAccordion.querySelectorAll('.plan-item')).find(item => item.dataset.label === lastSelectedPlanLabel);
            }
            if (selectedPlan) {
                selectedPlan.classList.add('selected');
            } else {
                const firstNonMemberPlan = nonMemberAccordion.querySelector('.plan-item');
                if (firstNonMemberPlan) firstNonMemberPlan.classList.add('selected');
            }
        });
    }
    if (comprehensivePanel && !userState.isMember) {
        comprehensivePanel.addEventListener('click', () => {
            nonMemberAccordion.classList.remove('selected');
            memberAccordion.classList.add('selected');
            comprehensivePanel.classList.add('selected');
            allPlanItems.forEach(item => item.classList.remove('selected'));
            let selectedPlan = null;
            if (lastSelectedPlanLabel) {
                selectedPlan = Array.from(memberAccordion.querySelectorAll('.plan-item')).find(item => item.dataset.label === lastSelectedPlanLabel);
            } if (selectedPlan) {
                selectedPlan.classList.add('selected');
            } else {
                const firstMemberPlan = memberAccordion.querySelector('.plan-item');
                if (firstMemberPlan) firstMemberPlan.classList.add('selected');
            }
        });
    }

    // --- Simple toggle for non-pricing accordions ---
    contentAccordions.forEach(accordion => {
        const header = accordion.querySelector('.accordion-header');
        if (header) {
            header.addEventListener('click', () => accordion.classList.toggle('open'));
        }
    });

    // --- Plan Selection Logic ---
    let lastSelectedPlanLabel = null; // Variable to store the label of the last selected plan

    allPlanItems.forEach(planItem => {
        planItem.addEventListener('click', (e) => {
            e.stopPropagation();
            allPlanItems.forEach(item => item.classList.remove('selected'));
            planItem.classList.add('selected');
            lastSelectedPlanLabel = planItem.dataset.label; // Update the last selected plan label
        });
    });

    // --- Add to Cart Logic ---
    if (addToCartButton) {
        addToCartButton.addEventListener('click', async (e) => {
            e.preventDefault();
            showButtonSpinner(addToCartButton);

            const isGuest = !userState.isLoggedIn;
            const isPanelSelected = comprehensivePanel.classList.contains('selected');
            const selectedPlan = document.querySelector('.plan-item.selected');

            if (!selectedPlan) {
                window.showToast('Select an item to proceed.', 'error');
                hideButtonSpinner(addToCartButton);
                return;
            }

            // Braze Tracking: Add to Cart Attempted
            if (window.trackEvent) {
                const eventProperties = {
                    product_id: selectedPlan.dataset.sku,
                    product_name: productData.product_name,
                    price: parseFloat(selectedPlan.dataset.price),
                    purchase_option: selectedPlan.dataset.isMember === 'true' ? 'member' : 'non-member',
                    comprehensive_panel_selected: isPanelSelected,
                    timestamp: new Date().toISOString()
                };
                window.trackEvent('add_to_cart_attempted', eventProperties);
                console.log('Braze event fired: add_to_cart_attempted', eventProperties);
            }

            try {
                let successMessage = 'Item added to cart!'; // Default success message

                // High-priority safeguard: If window.memerShip is true, always add only the selected plan.
                if (window.memerShip) {
                    const payload = {
                        sku: selectedPlan.dataset.sku,
                        __co: [{ "__oid": parseInt(selectedPlan.dataset.oid), "__ov": parseInt(selectedPlan.dataset.vid) }],
                        __q: 1
                    };
                    const result = await addToCartAPI(payload, isGuest);
                    if (!result || !result.success) {
                        throw new Error(result ? result.message : 'Could not add item to cart.');
                    }
                } else if (isPanelSelected) {
                    successMessage = 'Items added to cart!'; // More specific message
                    // If not a member AND comprehensive panel is selected (Scenario A behavior)
                    if (!productData.mega_member) {
                        throw new Error('Comprehensive panel details are missing.');
                    }
                    // 1. Add the comprehensive panel itself
                    const panelPayload = {
                        sku: productData.mega_member.sku,
                        __co: [{ "__oid": productData.mega_member.__oid, "__ov": productData.mega_member.__vid }],
                        __q: 1
                    };
                    const panelResult = await addToCartAPI(panelPayload, isGuest);

                    if (!panelResult || !panelResult.success) {
                        throw new Error(panelResult ? panelResult.message : 'Could not add the Comprehensive Panel to your cart.');
                    }

                    // Braze Tracking: Comprehensive Panel Added
                    if (window.trackEvent) {
                        const eventProperties = {
                            product_id: productData.mega_member.sku,
                            timestamp: new Date().toISOString()
                        };
                        window.trackEvent('comprehensive_panel_added', eventProperties);
                        console.log('Braze event fired: comprehensive_panel_added', eventProperties);
                    }

                    // 2. Add the main member plan
                    const planPayload = {
                        sku: selectedPlan.dataset.sku,
                        __co: [{ "__oid": parseInt(selectedPlan.dataset.oid), "__ov": parseInt(selectedPlan.dataset.vid) }],
                        __q: 1
                    };
                    const planResult = await addToCartAPI(planPayload, isGuest);

                    if (!planResult || !planResult.success) {
                        throw new Error(planResult ? planResult.message : 'Could not add your selected plan to the cart.');
                    }
                } else {
                    // If not a member AND comprehensive panel is NOT selected (Scenario B behavior)
                    const payload = {
                        sku: selectedPlan.dataset.sku,
                        __co: [{ "__oid": parseInt(selectedPlan.dataset.oid), "__ov": parseInt(selectedPlan.dataset.vid) }],
                        __q: 1
                    };
                    const result = await addToCartAPI(payload, isGuest);
                    if (!result || !result.success) {
                        throw new Error(result ? result.message : 'Could not add item to cart.');
                    }
                }

                // Braze Tracking: Add to Cart Success
                if (window.trackEvent) {
                    const eventProperties = {
                        product_id: selectedPlan.dataset.sku,
                        cart_id: getCartId(),
                        timestamp: new Date().toISOString()
                    };
                    window.trackEvent('add_to_cart_success', eventProperties);
                    console.log('Braze event fired: add_to_cart_success', eventProperties);
                }

                // Common success handling
                window.showToast(successMessage, 'success');
                window.toggleCart();

            } catch (error) {
                // Braze Tracking: Add to Cart Failed
                if (window.trackEvent) {
                    const eventProperties = {
                        product_id: selectedPlan.dataset.sku,
                        reason: error.message || 'Unknown error',
                        timestamp: new Date().toISOString()
                    };
                    window.trackEvent('add_to_cart_failed', eventProperties);
                    console.log('Braze event fired: add_to_cart_failed', eventProperties);
                }

                console.error(error); // Keep for developers
                hideButtonSpinner(addToCartButton);
                window.showToast('There was a problem adding the item to your cart. Please try again.', 'error'); // User-friendly message
            } finally {
                hideButtonSpinner(addToCartButton); // Ensure spinner is hidden on success or if catch re-throws
            }
        });
    }
};

const getSkuFromUrl = () => {
    const pathSegments = window.location.pathname.split('/');
    return pathSegments[pathSegments.length - 1];
};

// --- Main Initialization ---
const initProductDetailPage = async () => {
    injectLoaderStyles();
    const container = document.querySelector('.product-detail-container');
    if (!container) {
        console.error('Product detail container not found.');
        return;
    }

    const sku = getSkuFromUrl();
    if (!sku) {
        container.innerHTML = '<p>Could not find product SKU in the URL.</p>';
        return;
    }

    // We need to store the original HTML to restore it after the loader
    const originalHTML = container.innerHTML;
    showDetailsLoader(container);
    const productData = await fetchProductDetails(sku);
    hideDetailsLoader(container);

    if (productData) {
        container.innerHTML = originalHTML; // Restore the original structure
        renderMainInfo(productData);
        renderTags(productData);
        renderPricing(productData);
        renderComprehensivePanel(productData);
        // renderContentAccordions();

        const userState = {
            isLoggedIn: !!(window.authToken),
            isMember: !!(window.memerShip),
        };

        setupEventListeners(userState, productData);
        window.kwiltProductDetailsUtils.updateUI();

        // Braze Tracking: Product Viewed
        if (window.trackEvent) {
            const eventProperties = {
                product_id: productData.sku,
                product_name: productData.product_name,
                price: productData.price,
                mega_member_price: productData.mega_member_price,
                has_mega_pricing: !!productData.mega_member_price,
                is_mega_member: userState.isMember,
                timestamp: new Date().toISOString()
            };
            window.trackEvent('product_viewed', eventProperties);
            console.log('Braze event fired: product_viewed', eventProperties);
        }
    } else {
        container.innerHTML = '<p style="text-align: center; margin-top: 50px;">Sorry, this product could not be loaded.</p>';
    }
};

// --- Execute ---
document.addEventListener('DOMContentLoaded', initProductDetailPage);
