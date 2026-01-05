/**
 * Consent Management Platform (CMP) Configuration
 * 
 * Integrated with Cookiebot CMP using IAB TCF v2.2
 * Cookiebot exposes window.__tcfapi for TCF compliance
 */

(function() {
    'use strict';

    let eventListenerRegistered = false;

    /**
     * Wait for TCF API to be available
     * Polls every 50ms until window.__tcfapi exists or timeout
     * 
     * @param {number} timeoutMs - Maximum time to wait in milliseconds (default: 3500)
     * @returns {Promise<boolean>} true if TCF API found, false if timeout
     */
    function waitForTCF(timeoutMs = 3500) {
        return new Promise((resolve) => {
            if (typeof window.__tcfapi !== 'undefined') {
                resolve(true);
                return;
            }

            const startTime = Date.now();
            const pollInterval = 50;

            const poll = setInterval(() => {
                if (typeof window.__tcfapi !== 'undefined') {
                    clearInterval(poll);
                    resolve(true);
                } else if (Date.now() - startTime >= timeoutMs) {
                    clearInterval(poll);
                    resolve(false);
                }
            }, pollInterval);
        });
    }

    /**
     * Get TCF consent data
     * 
     * @returns {Promise<Object|null>} TCF data object or null if unavailable/error
     */
    async function getTCData() {
        try {
            const tcfAvailable = await waitForTCF();
            if (!tcfAvailable) {
                return null;
            }

            return new Promise((resolve) => {
                window.__tcfapi('getTCData', 2, (tcData, success) => {
                    if (success && tcData) {
                        resolve(tcData);
                    } else {
                        resolve(null);
                    }
                });
            });
        } catch (e) {
            console.warn('Error getting TCF data:', e);
            return null;
        }
    }

    /**
     * Check if consent for ads is granted
     * 
     * Strict requirement: ALL of the following must be true:
     * - Purpose 1: Store and/or access information on a device
     * - Purpose 3: Create a personalised ads profile
     * - Purpose 4: Select personalised ads
     * 
     * Fail closed: if anything is uncertain => return false
     * 
     * Note: Can later be modified to allow non-personalized ads if desired
     * 
     * @returns {Promise<boolean>} true if all required consents granted, false otherwise
     */
    window.__hasConsentForAds = async function() {
        try {
            const tcData = await getTCData();
            if (!tcData || !tcData.purpose || !tcData.purpose.consents) {
                return false;
            }

            const consents = tcData.purpose.consents;

            // Strict check: ALL required purposes must be consented
            const hasConsent = 
                consents[1] === true &&  // Store/access
                consents[3] === true &&  // Create ads profile
                consents[4] === true;    // Select personalized ads

            return hasConsent;
        } catch (e) {
            console.warn('Error checking ads consent:', e);
            return false;
        }
    };

    /**
     * Open CMP consent preferences dialog
     * Uses Cookiebot native API with retry logic for Safari
     */
    window.__openCMP = async function () {
        const maxRetries = 20;
        const retryDelay = 100;

        for (let i = 0; i < maxRetries; i++) {
            if (window.Cookiebot && typeof window.Cookiebot.show === 'function') {
                window.Cookiebot.show();
                return;
            }
            if (window.Cookiebot && typeof window.Cookiebot.renew === 'function') {
                window.Cookiebot.renew();
                return;
            }
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }

        alert('Οι ρυθμίσεις cookies δεν είναι ακόμη διαθέσιμες. Κάνε refresh και δοκίμασε ξανά.');
    };

    /**
     * Handle consent granted (CookiebotOnAccept event)
     * Unlocks phrase display
     */
    function handleConsentGranted() {
        console.log('Cookiebot: Consent granted');
        window.__notifyConsentUpdated();
    }

    /**
     * Handle consent denied (CookiebotOnDecline event)
     * Shows fallback UI
     */
    function handleConsentDenied() {
        console.log('Cookiebot: Consent denied');
        window.__notifyConsentUpdated();
    }

    /**
     * Initialize Cookiebot event listeners (idempotent)
     */
    let cookiebotListenersRegistered = false;
    function initCookiebotListeners() {
        if (cookiebotListenersRegistered) {
            return;
        }

        window.addEventListener('CookiebotOnAccept', handleConsentGranted);
        window.addEventListener('CookiebotOnDecline', handleConsentDenied);
        cookiebotListenersRegistered = true;
        console.log('Cookiebot: Event listeners registered');
    }

    /**
     * Notify that consent has been updated
     * Dispatches event that ads.js listens for
     */
    window.__notifyConsentUpdated = function() {
        const event = new CustomEvent('cmp:consent-updated', {
            bubbles: false,
            cancelable: false
        });
        window.dispatchEvent(event);
    };

    /**
     * Initialize consent event listener
     * Registers listener for TCF consent changes
     * Idempotent: won't register multiple times
     */
    async function initConsentListener() {
        if (eventListenerRegistered) {
            return;
        }

        const tcfAvailable = await waitForTCF();
        if (!tcfAvailable) {
            return;
        }

        try {
            window.__tcfapi('addEventListener', 2, (tcData, success) => {
                if (success && tcData) {
                    const eventStatus = tcData.eventStatus;
                    // Notify on initial load or user action
                    if (eventStatus === 'tcloaded' || eventStatus === 'useractioncomplete') {
                        window.__notifyConsentUpdated();
                    }
                }
            });

            eventListenerRegistered = true;
        } catch (e) {
            console.warn('Error registering consent listener:', e);
        }
    }

    /**
     * Legacy function for backward compatibility
     * @returns {Promise<boolean>}
     */
    window.hasConsent = async function() {
        const tcData = await getTCData();
        if (!tcData || !tcData.purpose || !tcData.purpose.consents) {
            return false;
        }
        // Purpose 1: Store/access
        return tcData.purpose.consents[1] === true;
    };

    /**
     * Legacy function for backward compatibility
     */
    window.openConsentPreferences = window.__openCMP;

    /**
     * Initialize consent management
     * Called after page load
     */
    window.initConsent = function() {
        // Register Cookiebot event listeners
        initCookiebotListeners();
        // Register TCF event listener for ads.js compatibility
        initConsentListener();
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initConsent);
    } else {
        initConsent();
    }

})();
