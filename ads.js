/**
 * AdSense Ad Loader
 * 
 * This script loads ads only when consent is granted.
 * It listens for consent updates and attempts to load ads accordingly.
 * 
 * INSTRUCTIONS:
 * 1. Replace the placeholder AdSense code with your actual publisher ID
 * 2. Ensure consent-config.js provides window.__hasConsentForAds()
 */

(function() {
    'use strict';

    const ADSENSE_APPROVED = false;
    let adsInitialized = false;
    const AD_SLOT_ID = 'ad-slot-home';

    /**
     * Check if ads can be loaded (consent granted)
     * @returns {Promise<boolean>}
     */
    async function canLoadAds() {
        if (typeof window.__hasConsentForAds === 'function') {
            try {
                return await window.__hasConsentForAds();
            } catch (e) {
                console.warn('Error checking ads consent:', e);
                return false;
            }
        }
        // Default: no consent, don't load ads
        return false;
    }

    /**
     * Initialize AdSense ad slot
     * This function is idempotent - safe to call multiple times
     */
    async function initAds() {
        if (!ADSENSE_APPROVED) {
            return;
        }

        // Prevent multiple initializations
        if (adsInitialized) {
            return;
        }

        const adSlot = document.getElementById(AD_SLOT_ID);
        if (!adSlot) {
            return;
        }

        // Check consent before loading ads (async)
        const hasConsent = await canLoadAds();
        if (!hasConsent) {
            // Listen for consent updates
            window.addEventListener('cmp:consent-updated', async function() {
                const consentNow = await canLoadAds();
                if (consentNow && !adsInitialized) {
                    loadAdSense();
                }
            }, { once: true });
            return;
        }

        loadAdSense();
    }

    /**
     * Load Google AdSense script and create ad
     */
    function loadAdSense() {
        if (adsInitialized) {
            return;
        }

        const adSlot = document.getElementById(AD_SLOT_ID);
        if (!adSlot) {
            return;
        }

        // Mark as initialized to prevent duplicate loads
        adsInitialized = true;

        // 1. Load AdSense script (if not already loaded)
        if (!window.adsbygoogle) {
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8372893370319453';
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
        }

        // 2. Create responsive display ad unit
        const adUnit = document.createElement('ins');
        adUnit.className = 'adsbygoogle';
        adUnit.style.display = 'block';
        adUnit.setAttribute('data-ad-client', 'ca-pub-8372893370319453');
        // Note: Replace '1234567890' with your actual ad slot ID from AdSense dashboard when available
        adUnit.setAttribute('data-ad-slot', '1234567890');
        adUnit.setAttribute('data-ad-format', 'auto');
        adUnit.setAttribute('data-full-width-responsive', 'true');
        adSlot.appendChild(adUnit);

        // 3. Push to adsbygoogle array
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense error:', e);
        }
    }

    /**
     * Public API: Initialize ads when DOM is ready
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAds);
        } else {
            // DOM already loaded
            initAds();
        }
    }

    // Auto-initialize when script loads
    init();

    // Export for manual initialization if needed
    window.initAds = initAds;

})();

