<script defer src="https://cdn.jsdelivr.net/npm/inputmask @5.0.8/dist/inputmask.min.js"></script>

<script>
  if (window.location.href === 'https://www.kwilthealth.com/intake/membership') {
  
    const atkn = window.getCookie('atkn'); // Changed to use getCookie
    
    if (atkn) {
      	let url = new URL('https://devapp.kwilthealth.com/intake/mega-panel-intake', window.location.origin);
      	url.searchParams.set('t', atkn);
      	window.location.href = url.toString();
    } else {
      window.location.href = 'https://devapp.kwilthealth.com/intake/mega-panel-intake';
    }
  }
</script>

<script>
(async function() {
  const url = new URL(window.location.href);
  const tParam = url.searchParams.get("t");

  // Handle the 't' param logic
  if (tParam) {
    window.setCookie("atkn", tParam, 30); // Changed to use setCookie (assuming 30 days expiry)
    window.deleteCookie("__cid"); // Changed to use deleteCookie
    url.searchParams.delete("t");
    const newUrl =
      url.pathname + (url.search ? "?" + url.searchParams.toString() : "") + url.hash;
    window.history.replaceState({}, document.title, newUrl);
  }

  // Call the API (no data needed)
  try {
    const response = await fetch("https://kwilt-intake-396730550724.us-central1.run.app/webflow/sync-products");
    console.log("Sync API called. Status:", response.status);
  } catch (error) {
    console.error("Error calling sync API:", error);
  }
})();
</script>

<!--Load Braze Web SDK -->
<script src="https://cdn.jsdelivr.net/gh/Ganapatiexeire/kwilt @main/braze.min.js" defer></script>

<script>
document.addEventListener("DOMContentLoaded", function() {
  const BRAZE_API_KEY = "08e73207-8f37-4d8f-a9e6-7a3afedd9040";
  const BRAZE_BASE_URL = "https://sdk.iad-02.braze.com";

  if(window.braze) {
    braze.initialize(BRAZE_API_KEY, { baseUrl: BRAZE_BASE_URL, enableLogging: true });
    braze.openSession();
    console.log("[Braze] SDK initialized successfully");

    //braze.logCustomEvent("page_viewed", { url: window.location.href });
      window.trackEvent = (eventName, properties = {}) => {
        if (window.braze) {
          window.braze.logCustomEvent(eventName, properties);
          console.log('[Braze] Event tracked:', eventName, properties);

          // Force immediate data flush to send events to Braze servers immediately
          window.braze.requestImmediateDataFlush();
        } else {
          console.warn('[Braze] SDK not loaded, event not tracked:', eventName);
        }
      };
    braze.requestImmediateDataFlush();
  } else {
    console.error("❌ Braze SDK not loaded");
  }
});
</script>

<script>
  document.addEventListener('click', function (e) {
  const btn = e.target.closest('.signup-btn');
  
  if (btn && btn.tagName.toLowerCase() === 'a') {
    const atkn = window.getCookie('atkn'); // Changed to use getCookie
    
    if (atkn) {
      e.preventDefault();
      
      let url = new URL('https://devapp.kwilthealth.com/intake/mega-panel-intake', window.location.origin);
      url.searchParams.set('t', atkn);
      window.location.href = url.toString();
    }else{
      e.preventDefault();
     let url = new URL('https://devapp.kwilthealth.com/intake/mega-panel-intake', window.location.origin);
      window.location.href = url.toString() 
    }
  }
});
</script>

<!-- toast-->
<script>
// This toast script is already encapsulated and relies on `window.showToast`
// which is internally defined. No changes needed here.
(function () {
    // Ensure this script runs only once
    if (window.showToast) {
        return;
    }

    let toastContainer = null;
    const TOAST_TIMEOUT = 3000;

    const injectStyles = () => {
        if (document.getElementById('kwilt-toast-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'kwilt-toast-styles';
        style.innerHTML = `
            .kwilt-toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .kwilt-toast {
                display: flex;
                align-items: center;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                color: #fff;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 16px;
                line-height: 1.4;
                opacity: 0;
                transform: translateX(100%);
                animation: slideInRight 0.5s forwards;
            }

            .kwilt-toast.kwilt-toast--success {
                background-color: #edf9f1; /* Green */
                border: 1px solid #61c285;
                color: #61c285;
            }

            .kwilt-toast.kwilt-toast--error {
                background-color: #ef5f6df0; /* Red */
                border: 1px solid #eb1d32ff;
            }

            .kwilt-toast__message {
                flex-grow: 1;
                margin-right: 15px;
            }

            .kwilt-toast__close {
                background: none;
                border: none;
                color: inherit;
                font-size: 24px;
                font-weight: bold;
                cursor: pointer;
                opacity: 0.8;
                padding: 0 5px;
            }

            .kwilt-toast__close:hover {
                opacity: 1;
            }

            .kwilt-toast--removing {
                animation: fadeOut 0.5s forwards;
            }

            @keyframes slideInRight {
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @keyframes fadeOut {
                to {
                    opacity: 0;
                    transform: translateY(-20px);
                }
            }
        `;
        document.head.appendChild(style);
    };

    const createToastContainer = () => {
        if (toastContainer) {
            return;
        }
        toastContainer = document.createElement('div');
        toastContainer.className = 'kwilt-toast-container';
        document.body.appendChild(toastContainer);
    };

    const removeToast = (toastElement) => {
        if (!toastElement) return;

        toastElement.classList.add('kwilt-toast--removing');

        // Remove the element after the fade-out animation completes
        toastElement.addEventListener('animationend', () => {
            if (toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
        });
    };

    const showToast = (message, type = 'success') => {
        // Ensure styles and container are ready
        injectStyles();
        createToastContainer();

        const toastElement = document.createElement('div');
        toastElement.className = `kwilt-toast kwilt-toast--${type}`;

        const messageElement = document.createElement('div');
        messageElement.className = 'kwilt-toast__message';
        messageElement.textContent = message;

        const closeButton = document.createElement('button');
        closeButton.className = 'kwilt-toast__close';
        closeButton.innerHTML = '&times;';

        toastElement.appendChild(messageElement);
        toastElement.appendChild(closeButton);

        toastContainer.appendChild(toastElement);

        const timer = setTimeout(() => {
            removeToast(toastElement);
        }, TOAST_TIMEOUT);

        closeButton.addEventListener('click', () => {
            clearTimeout(timer); // Stop the auto-dismiss timer
            removeToast(toastElement);
        });
    };

    window.showToast = showToast;

})();

</script>
<!--toast end-->
<!-- Imapact UTT Start -->
 <script type="text/javascript">
(function(a,b,c,d,e,f,g){e['ire_o']=c;e[c]=e[c]||function(){(e[c].a=e[c].a||[]).push(arguments)};f=d.createElement(b);g=d.getElementsByTagName(b)[0];f.async=1;f.src=a;g.parentNode.insertBefore(f,g);})('https://utt.impactcdn.com/A6657572-6c5d-4b07-879f-af5d7366eb9b1.js','script','ire',document,window);
</script>
<!-- Imapact UTT End -->

<style>
body.details-template-page  .mobile-nav-icons._2.w-embed svg rect, 
body.details-template-page  .logo-mobile.w-embed svg path,
body.details-template-page  ul.nav-menu-block-mobile.w-list-unstyled li.list-item .mobile-nav-icons.w-embed svg path { fill:#452D0F; }
  body{
        overflow-x: hidden;
  }
  .tm-sub sub{
   	bottom:unset;
    font-size:9px;
  }
</style>