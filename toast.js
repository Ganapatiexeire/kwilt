
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
