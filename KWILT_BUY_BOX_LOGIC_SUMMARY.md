# KWILT Buy Box Logic Summary

This document outlines the logic for the "buy box" on an e-commerce website, detailing the user experience for three different types of users: logged-in members, logged-out members, and non-members.

---

## User Flow Analysis:

The document outlines three main user scenarios for purchasing a product, based on their membership and login status.

---

### 1. Member Logged In

This is the most straightforward path.

*   **Initial View:** The user sees two main pricing options: "MEMBER PRICING" and "NON-MEMBER". A "Comprehensive panel" option is hidden by default for this user type.
*   **Action:** The user selects "MEMBER PRICING".
*   **Result:** The user is taken directly to the **Shipping** page to complete their purchase. The "Add to Cart" step is skipped to streamline the process.
*   **Edge Case:**
    *   **Action:** A logged-in member selects "NON-MEMBER" pricing.
    *   **Result:** The system automatically corrects this. A message appears stating, "item has been switched to member pricing," and the user proceeds with the correct pricing.

---

### 2. Member Logged Out & 3. Non-Member (Logged In or Logged Out)

These two scenarios follow the same initial logic until the point of logging in.

*   **Initial View:** The user sees options for "MEMBER PRICING," "NON-MEMBER," and a "COMPREHENSIVE PANEL."
    *   A "non-member" can be a new visitor or a returning customer who has previously purchased non-member products.

*   **Scenario A: User selects "Non-Member" pricing.**
    *   **Action:** The user clicks the "NON-MEMBER" radio button.
    *   **Result:** The view expands to show subscription frequency options:
        *   MONTHLY
        *   MEMBER 6 MONTHS
        *   MEMBER 12 MONTHS
    *   The user selects a frequency and clicks "ADD TO CART."

*   **Scenario B: User selects the "Comprehensive Panel" without a price.**
    *   **Action:** The user clicks the "COMPREHENSIVE PANEL" radio button.
    *   **Result:** The system automatically selects "MEMBER PRICING" and reveals the frequency dropdown for the user to make a selection.

*   **Checkout Flow:**
    *   After adding an item to the cart, the user proceeds to checkout.
    *   The first step is **Sign In**.
    *   **Crucial Logic:** The order summary *must update* after the user logs in. For example, if a logged-out member had a non-member item in their cart, the summary should reflect member pricing after they log in.

---

### Post-Login Scenarios (After adding items to cart as a non-member/logged-out member)

The PDF details several scenarios that occur after the user logs in at the checkout stage.

*   **Logged-in member with a non-member item in cart (without comprehensive panel):**
    *   The cart updates to reflect member pricing. The image shows the subtotal and total adjusted.

*   **Logged-in member with a non-member item in cart (with comprehensive panel):**
    *   The cart updates similarly, adjusting the price to reflect the member discount.

*   **Logged-in member adds an item they already have a subscription for:**
    *   The system recognizes the existing subscription. The image shows a message in the summary: "Note: It looks like you already have an existing subscription for this item..."

---

### Cart Modification Logic (for Non-Members)

This section details how the cart behaves when the "Comprehensive Panel" is added or removed.

*   **Non-member has a panel and a member-priced item in the cart:**
    *   The summary reflects both items.

*   **Non-member removes the panel:**
    *   **Result:** The member-priced item is automatically removed and replaced with the equivalent non-member item at the same frequency. The cart total is updated to reflect the higher, non-member price.

### Key Business Requirement:

*   **Cross-Selling:** The note at the bottom emphasizes a critical requirement: "WE NEED TO BE ABLE TO CROSS SELL WITHIN THE CART (e.g. ADD COMPREHENSIVE PANEL GIFT TO CART)". This indicates a future feature where users can add items like the panel as a gift directly from the cart page.