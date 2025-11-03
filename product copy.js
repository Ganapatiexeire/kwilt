const API_URL = 'https://kwilt-intake-396730550724.us-central1.run.app/products';

// Create a global object to hold our utility functions
window.kwiltProductUtils = window.kwiltProductUtils || {};

// --- Start: UI Styles and Helpers ---

/**
 * Injects the necessary CSS for the loader and empty state into the document head.
 * This ensures the styles are available without needing a separate CSS file.
 */
const injectStyles = () => {
    // Prevent injecting styles more than once
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
            min-height: 300px; /* Ensures container has height */
            text-align: center;
            color: #666;
            font-family: sans-serif;
        }
    `;
    document.head.appendChild(style);
};

/**
 * Displays a loader inside the product container.
 * @param {HTMLElement} container - The container element to show the loader in.
 */
const showLoader = (container) => {
    if (!container) return;
    container.innerHTML = '<div class="kwilt-loader"></div>';
    container.classList.remove('kwilt-product-container-empty');
};

// --- End: UI Styles and Helpers ---


/**
 * Fetches the product list from the API.
 * @returns {Promise<Array>} A promise that resolves to an array of product objects.
 */
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
        return []; // Return empty array on error
    }
};

/**
 * Renders a list of product objects into the DOM.
 * This is an internal helper function.
 * @param {Array} products - The array of product objects to render.
 */
const _renderProductsToDOM = (products) => {
    const container = document.getElementById('slicksliderproduct');
    if (!container) {
        console.error('Product container #slicksliderproduct not found.');
        return;
    }
    container.innerHTML = ''; // Clear loader or previous content
    container.classList.remove('kwilt-product-container-empty');


    if (!products || products.length === 0) {
        container.innerHTML = '<p>No products found for this category.</p>';
        container.classList.add('kwilt-product-container-empty');
        return;
    }

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
                    <a href="/product/${product.sku}" class="button add-tocart-button w-button">ADD TO CART</a>
                </div>
            </div>
        `;
        container.appendChild(productElement);
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

/**
 * Fetches all products and renders them to the DOM.
 */
window.kwiltProductUtils.renderAllProducts = async () => {
    injectStyles(); // Ensure styles are loaded
    const container = document.getElementById('slicksliderproduct');
    showLoader(container);
    const allProducts = await fetchProducts();
    _renderProductsToDOM(allProducts);
};

/**
 * Fetches products, filters them by the category found in the URL, and renders them.
 */
window.kwiltProductUtils.renderProductsByCategory = async () => {
    injectStyles(); // Ensure styles are loaded
    const container = document.getElementById('slicksliderproduct');
    showLoader(container);

    const categorySlug = getCategoryFromPath();
    if (!categorySlug) {
        console.warn('No category found in the URL path. Cannot render category products.');
        _renderProductsToDOM([]); // Render empty state
        return;
    }

    const allProducts = await fetchProducts();
    const filteredProducts = allProducts.filter(product =>
        product.category && product.category.some(cat => normalizeCategory(cat) === categorySlug)
    );
    _renderProductsToDOM(filteredProducts);
};