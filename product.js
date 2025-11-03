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
            border: 5px solid #452D0F; /* Kwilt Bark color */
            border-bottom-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 100px auto; /* Centered with top margin */
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .kwilt-product-container-empty {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 300px;
            text-align: center;
            color: #666;
            font-family: sans-serif;
        }

        .button-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #fff;
            border-bottom-color: transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        .quick-add-popup {
            display: none;
            position: absolute;
            bottom: 50px;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #eee;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            padding: 15px;
            z-index: 10;
        }

        .add-tocart-button:hover + .quick-add-popup,
        .quick-add-popup:hover,
        .add-tocart-button.active + .quick-add-popup {
            display: block;
        }

        .plan-item {
            display: flex;
            align-items: center;
            padding: 10px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
        }

        .plan-item:last-child {
            border-bottom: none;
        }

        .plan-item.selected {
            background-color: #f0f0f0;
        }

        .plan-radio {
            width: 16px;
            height: 16px;
            border: 1px solid #ccc;
            border-radius: 50%;
            margin-right: 10px;
            position: relative;
        }

        .plan-item.selected .plan-radio {
            border-color: #452D0F;
            background-color: #452D0F;
        }
        
        .plan-item.selected .plan-radio::after {
            content: '';
            position: absolute;
            top: 4px;
            left: 4px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: white;
        }

        .plan-details {
            display: flex;
            justify-content: space-between;
            flex-grow: 1;
        }

        .plan-label {
            font-weight: bold;
        }

        .quick-add-to-cart-btn {
            margin-top: 10px;
            width: 100%;
        }
    `;
    document.head.appendChild(style);
};

const showLoader = (container) => {
    if (!container) return;
    container.innerHTML = '<div class="kwilt-loader"></div>';
    container.classList.remove('kwilt-product-container-empty');
};

const showButtonSpinner = (button) => {
    button.disabled = true;
    button.style.display = 'flex';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';
    button.innerHTML = '<span class="button-spinner"></span>';
};

const hideButtonSpinner = (button, text = 'ADD TO CART') => {
    button.disabled = false;
    button.style.display = '';
    button.style.justifyContent = '';
    button.style.alignItems = '';
    button.innerHTML = text;
};

// --- End: UI Styles and Helpers ---


const fetchProducts = async () => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        const data = await response.json();
        return data.data.products || [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};

const _renderProductsToDOM = (products) => {
    const container = document.getElementById('slicksliderproduct');
    if (!container) {
        console.error('Product container #slicksliderproduct not found.');
        return;
    }
    container.innerHTML = '';
    container.classList.remove('kwilt-product-container-empty');


    if (!products || products.length === 0) {
        container.innerHTML = '<p>No products found for this category.</p>';
        container.classList.add('kwilt-product-container-empty');
        return;
    }

    const isMember = !!window.memerShip;
    const priceKey = isMember ? 'mega_member_installment_price' : 'installment_price';

    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.classList.add('collection-item', 'w-dyn-item', 'w-col', 'w-col-4');
        productElement.setAttribute('role', 'listitem');

        const bestSellerTag = product.bestseller ? `
            <div class="product-tag list">
                <div class="product-tag-style fs10">BEST SELLER</div>
            </div>
        ` : '';

        const labRequiredTag = product.labs_required ? `
            <div class="product-tag list">
                <img src="https://cdn.prod.website-files.com/6830e308e57fd4713ea17bc9/687e7ec5af2598250628407d_Ellipse%20259.svg" loading="lazy" width="10" height="10" alt="">
                <div id="dot-mark" class="product-tag-style fs10">LAB REQUIRED</div>
            </div>
        ` : '';

        const quickAddOptions = staticProductData.child_options.map(option => `
            <div class="plan-item" data-sku="${option.sku}" data-oid="${option.__oid}" data-vid="${option.__vid}">
                <div class="plan-radio"></div>
                <div class="plan-details">
                    <div class="plan-label">${option.frequency_count} ${option.frequency_unit}</div>
                    <div class="plan-price">$${parseFloat(option[priceKey]).toFixed(0)}</div>
                </div>
            </div>
        `).join('');

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
                    <button class="button add-tocart-button w-button">ADD TO CART</button>
                    <div class="quick-add-popup">
                        ${quickAddOptions}
                        <button class="button quick-add-to-cart-btn w-button">Add to Cart</button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(productElement);
    });
    setupQuickAddListeners();
};

const setupQuickAddListeners = () => {
    const productWraps = document.querySelectorAll('.product-wrap');

    productWraps.forEach(productWrap => {
        const quickAddBtn = productWrap.querySelector('.add-tocart-button');
        const quickAddPopup = productWrap.querySelector('.quick-add-popup');
        const planItems = productWrap.querySelectorAll('.plan-item');
        const addToCartBtn = productWrap.querySelector('.quick-add-to-cart-btn');

        quickAddBtn.addEventListener('click', (e) => {
            e.preventDefault();
            quickAddBtn.classList.toggle('active');
        });

        quickAddBtn.addEventListener('mouseenter', () => {
            quickAddBtn.textContent = 'QUICK ADD';
        });

        quickAddBtn.addEventListener('mouseleave', () => {
            if (!quickAddBtn.classList.contains('active')) {
                quickAddBtn.textContent = 'ADD TO CART';
            }
        });

        planItems.forEach(item => {
            item.addEventListener('click', () => {
                planItems.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
            });
        });

        addToCartBtn.addEventListener('click', async (e) => {
            const selectedPlan = productWrap.querySelector('.plan-item.selected');
            if (!selectedPlan) {
                window.showToast('Please select a plan.', 'error');
                return;
            }

            showButtonSpinner(addToCartBtn);

            const userState = {
                isLoggedIn: !!window.authToken,
                isMember: !!window.memerShip,
            };
            const isGuest = !userState.isLoggedIn;

            try {
                const payload = {
                    sku: selectedPlan.dataset.sku,
                    __co: [{ "__oid": parseInt(selectedPlan.dataset.oid), "__ov": parseInt(selectedPlan.dataset.vid) }],
                    __q: 1
                };
                
                const result = await addToCartAPI(payload, isGuest);
                if (!result || !result.success) {
                    throw new Error(result ? result.message : 'Could not add item to cart.');
                }

                window.showToast('Item added to cart!', 'success');
                window.toggleCart();

            } catch (error) {
                console.error(error);
                window.showToast('There was a problem adding the item to your cart.', 'error');
            } finally {
                hideButtonSpinner(addToCartBtn, 'Add to Cart');
            }
        });
    });
};


const normalizeCategory = (category) => {
    if (typeof category !== 'string') return '';
    return category.toLowerCase().replace(/\s+/g, '-');
};

const getCategoryFromPath = () => {
    const pathParts = window.location.pathname.split('/').filter(part => part);
    if (pathParts.length === 2 && pathParts[0] === 'category') {
        return pathParts[1];
    }
    return null;
};

window.kwiltProductUtils.renderAllProducts = async () => {
    injectStyles();
    const container = document.getElementById('slicksliderproduct');
    showLoader(container);
    const allProducts = await fetchProducts();
    _renderProductsToDOM(allProducts);
};

window.kwiltProductUtils.renderProductsByCategory = async () => {
    injectStyles();
    const container = document.getElementById('slicksliderproduct');
    showLoader(container);

    const categorySlug = getCategoryFromPath();
    if (!categorySlug) {
        console.warn('No category found in the URL path. Cannot render category products.');
        _renderProductsToDOM([]);
        return;
    }

    const allProducts = await fetchProducts();
    const filteredProducts = allProducts.filter(product =>
        product.category && product.category.some(cat => normalizeCategory(cat) === categorySlug)
    );
    _renderProductsToDOM(filteredProducts);
};