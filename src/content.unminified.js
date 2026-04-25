const STYLE_ID = 'fb-messenger-custom-style';
const MEDIA_STYLE_ID = 'fb-messenger-media-style';
const DIRECT_MEDIA_STYLE_ID = 'fb-direct-media-style';
const OVERLAY_ID = 'fb-initial-load-overlay';
const OVERLAY_STYLE_ID = 'fb-initial-overlay-style';
const HIDE_STYLE_ID = 'fb-hide-initial-style';
const CLOSE_BTN_ID = 'fb-messenger-direct-close-btn';
const DYNAMIC_WIDTH_ID = 'fb-messenger-dynamic-width';
const XOR_KEY = 0x7A; 

const currentLoc = window.location.href;
const prevSessionLoc = sessionStorage.getItem('messengerify_current_url');
let isReload = (prevSessionLoc === currentLoc);

let appSettings = {
    showMessengerSplash: true,
    showFbButton: true,
    autoPlayGifs: true,
    threadWidth: 32,
    hideScrollBar: true
};

chrome.storage.local.get(appSettings, (res) => {
    appSettings = res;
    updateDynamicWidth(appSettings.threadWidth);
    updateScrollBarMode(appSettings.hideScrollBar);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'UPDATE_WIDTH') {
        appSettings.threadWidth = request.width;
        updateDynamicWidth(request.width);
        sendResponse({status: "ok"});
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.threadWidth) {
        appSettings.threadWidth = changes.threadWidth.newValue;
        updateDynamicWidth(appSettings.threadWidth);
    }
    if (namespace === 'local' && changes.hideScrollBar) {
        appSettings.hideScrollBar = changes.hideScrollBar.newValue;
        updateScrollBarMode(appSettings.hideScrollBar);
    }
});

function updateDynamicWidth(width) {
    const url = window.location.href;
    if (!url.includes('facebook.com/messages') && !url.includes('facebook.com/messenger_media')) {
        let style = document.getElementById(DYNAMIC_WIDTH_ID);
        if (style) style.remove();
        return;
    }

    let style = document.getElementById(DYNAMIC_WIDTH_ID);
    if (!style) {
        style = document.createElement('style');
        style.id = DYNAMIC_WIDTH_ID;
        (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = `[role="navigation"] { 
        width: ${width}% !important; 
        min-width: ${width}% !important; 
        max-width: ${width}% !important; 
        flex-basis: ${width}% !important; 
        transition: all 0.1s linear !important; 
    }`;
}

function updateScrollBarMode(isHidden) {
    const url = window.location.href;
    const isMessagesUrl = url.includes('facebook.com/messages');
    const isMediaUrl = url.includes('facebook.com/messenger_media');

    if ((isMessagesUrl || isMediaUrl) && isHidden) {
        document.documentElement.style.setProperty('overflow-y', 'hidden', 'important');
    } else {
        document.documentElement.style.removeProperty('overflow-y');
    }
}

if (window.performance) {
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0 && navEntries[0].type === "reload") {
        isReload = true;
    } else if (performance.navigation && performance.navigation.type === 1) {
        isReload = true;
    }
}

if (currentLoc.includes('facebook.com/messenger_media') && isReload) {
    sessionStorage.removeItem('messengerify_visited_messages');
}
sessionStorage.setItem('messengerify_current_url', currentLoc);

const MEDIA_BUTTONS_CSS = `
.x6s0dn4.x78zum5.x1s65kcs.x1pak89f.x10l6tqk.x1vjfegm {
    position: fixed !important; top: 15px !important; right: 15px !important; z-index: 2147483647 !important; 
}`;

const MEDIA_CSS_RULES = `
div[aria-label="Account Controls and Settings"] { display: none !important; }
a[aria-label="Facebook"] { display: none !important; }
` + MEDIA_BUTTONS_CSS;

const DIRECT_MEDIA_CSS_RULES = `[role="banner"] { display: none !important; }` + MEDIA_BUTTONS_CSS;

const CLOSE_BTN_HTML = `
<div aria-hidden="false" aria-label="Close" class="x1i10hfl xjqpnuy xc5r6h4 xqeqjp1 x1phubyo x13fuv20 x18b5jzi x1q0q8m5 x1t7ytsu x1ypdohk xdl72j9 x2lah0s x3ct3a4 xdj266r x14z9mp xat24cr x1lziwak x2lwn1j xeuugli x16tdsg8 x1hl2dhg xggy1nq x1ja2u2z x1t137rt x1q0g3np x87ps6o x1lku1pv x1a2a7pz x6s0dn4 x1iwo8zk x1033uif x179ill4 x1b60jn0 x972fbf x10w94by x1qhh985 x14e42zd x9f619 x78zum5 xl56j7k xexx8yu xyri2b x18d9i69 x1c1uobl x1n2onr6 x1vqgdyp x100vrsf x1qhmfi1" role="button" tabindex="0" style="
    position: fixed; top: 15px; left: 15px; z-index: 2147483647; cursor: pointer; background: rgba(0, 0, 0, 0.4); border-radius: 50%; padding: 8px;
"><svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor" aria-hidden="true" class="x14rh7hd x1lliihq x1tzjh5l x1k90msu x2h7rmj x1qfuztq" style="--x-color: var(--always-white, white);"><path d="M15.543 3.043a1 1 0 1 1 1.414 1.414L11.414 10l5.543 5.542a1 1 0 0 1-1.414 1.415L10 11.414l-5.543 5.543a1 1 0 0 1-1.414-1.415L8.586 10 3.043 4.457a1 1 0 1 1 1.414-1.414L10 8.586l5.543-5.543z"></path></svg><div class="x1ey2m1c xtijo5x x1o0tod xg01cxk x47corl x10l6tqk x13vifvy x1ebt8du x19991ni x1dhq9h x1iwo8zk x1033uif x179ill4 x1b60jn0" role="none" data-visualcompletion="ignore" style="inset: 0px;"></div></div>`;

async function getdecrImage(filename) {
    try {
        const url = chrome.runtime.getURL(filename);
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        for (let i = 0; i < uint8Array.length; i++) uint8Array[i] ^= XOR_KEY;
        const blob = new Blob([uint8Array], { type: 'image/webp' });
        return URL.createObjectURL(blob);
    } catch (e) {
        return '';
    }
}

function initLoadingOverlay() {
    chrome.storage.local.get({showMessengerSplash: true}, (res) => {
        if (!res.showMessengerSplash) return; 

        const url = window.location.href;
        const isMessagesUrl = url.includes('facebook.com/messages');
        const isMediaUrl = url.includes('facebook.com/messenger_media');

        if (isMessagesUrl) sessionStorage.setItem('messengerify_visited_messages', 'true');
        const isFromMessages = sessionStorage.getItem('messengerify_visited_messages') === 'true';

        if (!isMessagesUrl && !isMediaUrl) return;
        if (document.readyState === 'complete') return;

        if (isMediaUrl) {
            if (isFromMessages) {
                const hideBannerStyle = document.createElement('style');
                hideBannerStyle.id = 'fb-hide-media-banner-initial';
                hideBannerStyle.textContent = '[role="banner"] { display: none !important; }';
                document.documentElement.appendChild(hideBannerStyle);

                window.addEventListener('load', () => {
                    setTimeout(() => {
                        if (document.getElementById('fb-hide-media-banner-initial')) {
                            document.getElementById('fb-hide-media-banner-initial').remove();
                        }
                    }, 150);
                });
            } else {
                const directMediaStyle = document.createElement('style');
                directMediaStyle.id = DIRECT_MEDIA_STYLE_ID;
                directMediaStyle.textContent = DIRECT_MEDIA_CSS_RULES;
                document.documentElement.appendChild(directMediaStyle);
            }
            return; 
        }

        const overlayStyle = document.createElement('style');
        overlayStyle.id = OVERLAY_STYLE_ID;
        overlayStyle.textContent = `
            #${OVERLAY_ID} {
                position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important;
                background-color: #ffffff !important; z-index: 2147483647 !important; transition: opacity 0.3s ease !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
            }
            @media (prefers-color-scheme: dark) { #${OVERLAY_ID} { background-color: rgba(36, 37, 38, 1) !important; } }
            html.__fb-dark-mode #${OVERLAY_ID} { background-color: rgba(36, 37, 38, 1) !important; }
            html.__fb-light-mode #${OVERLAY_ID} { background-color: #ffffff !important; }
        `;
        document.documentElement.appendChild(overlayStyle);

        const hideStyle = document.createElement('style');
        hideStyle.id = HIDE_STYLE_ID;
        hideStyle.textContent = `
            body { opacity: 0 !important; pointer-events: none !important; }
            html { background-color: #ffffff !important; }
            @media (prefers-color-scheme: dark) { html { background-color: rgba(36, 37, 38, 1) !important; } }
            html.__fb-dark-mode { background-color: rgba(36, 37, 38, 1) !important; }
            html.__fb-light-mode { background-color: #ffffff !important; }
        `;
        document.documentElement.appendChild(hideStyle);

        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.innerHTML = `
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                <img id="fb-ext-messenger-logo" width="82" height="82" alt="Messenger Logo" style="opacity: 0; transition: opacity 0.2s;" />
            </div>
            <div style="position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <span id="fb-ext-meta-text" style="color: #8A8D91; font-size: 14px; font-weight: 500; margin-bottom: 4px; opacity: 0; transition: opacity 0.2s;">from</span>
                <div style="display: flex; align-items: center;">
                    <img id="fb-ext-meta-logo" height="55" alt="Meta Logo" style="opacity: 0; transition: opacity 0.2s;" />
                </div>
            </div>
        `;
        document.documentElement.appendChild(overlay);

        Promise.all([ getdecrImage('assets/r7tqrps.webp'), getdecrImage('assets/q7tqrps.webp') ]).then(([messengerUrl, metaUrl]) => {
            const messengerImg = document.getElementById('fb-ext-messenger-logo');
            const metaImg = document.getElementById('fb-ext-meta-logo');
            const metaText = document.getElementById('fb-ext-meta-text');
            
            if (messengerImg && messengerUrl) {
                messengerImg.src = messengerUrl;
                messengerImg.style.opacity = '1';
                let link = document.querySelector("link[rel~='icon']");
                if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
                link.href = messengerUrl;
            }
            if (metaImg && metaUrl) {
                metaImg.src = metaUrl;
                metaImg.style.opacity = '1';
                if (metaText) metaText.style.opacity = '1';
            }
        });

        window.addEventListener('load', () => {
            if (document.getElementById(HIDE_STYLE_ID)) document.getElementById(HIDE_STYLE_ID).remove();
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                if (document.getElementById(OVERLAY_STYLE_ID)) document.getElementById(OVERLAY_STYLE_ID).remove();
            }, 300);
        });
    });
}

initLoadingOverlay();

const CSS_RULES = `
[role="banner"] { display: none !important; }
:root, .__fb-light-mode, .__fb-dark-mode { --header-height: 0 !important; --messenger-card-spacing: 10px !important; }
.fbPageBanner { display: none !important; }`;

function applyOrRemoveStyle() {
    const url = window.location.href;
    sessionStorage.setItem('messengerify_current_url', url);

    const isMessagesUrl = url.includes('facebook.com/messages');
    const isMediaUrl = url.includes('facebook.com/messenger_media');
    
    if (isMessagesUrl) sessionStorage.setItem('messengerify_visited_messages', 'true');
    const isFromMessages = sessionStorage.getItem('messengerify_visited_messages') === 'true';

    let styleElement = document.getElementById(STYLE_ID);
    let mediaStyleElement = document.getElementById(MEDIA_STYLE_ID);
    let directMediaStyleElement = document.getElementById(DIRECT_MEDIA_STYLE_ID);
    let closeBtnElement = document.getElementById(CLOSE_BTN_ID);
    let dynamicWidthElement = document.getElementById(DYNAMIC_WIDTH_ID);

    if (isMessagesUrl) {
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = STYLE_ID;
            styleElement.textContent = CSS_RULES;
            (document.head || document.documentElement).appendChild(styleElement);
            updateDynamicWidth(appSettings.threadWidth);
        }
        if (mediaStyleElement) mediaStyleElement.remove();
        if (directMediaStyleElement) directMediaStyleElement.remove();
        if (closeBtnElement) closeBtnElement.remove();
        
    } else if (isMediaUrl) {
        if (isFromMessages) {
            if (!mediaStyleElement) {
                mediaStyleElement = document.createElement('style');
                mediaStyleElement.id = MEDIA_STYLE_ID;
                mediaStyleElement.textContent = MEDIA_CSS_RULES;
                (document.head || document.documentElement).appendChild(mediaStyleElement);
            }
            if (styleElement) styleElement.remove();
            if (directMediaStyleElement) directMediaStyleElement.remove();
            if (closeBtnElement) closeBtnElement.remove();
        } else {
            if (!directMediaStyleElement) {
                directMediaStyleElement = document.createElement('style');
                directMediaStyleElement.id = DIRECT_MEDIA_STYLE_ID;
                directMediaStyleElement.textContent = DIRECT_MEDIA_CSS_RULES;
                (document.head || document.documentElement).appendChild(directMediaStyleElement);
            }
            
            if (!closeBtnElement && document.body) {
                const wrapper = document.createElement('div');
                wrapper.id = CLOSE_BTN_ID;
                wrapper.innerHTML = CLOSE_BTN_HTML;
                
                const actualBtn = wrapper.firstElementChild;
                if (actualBtn) {
                    actualBtn.addEventListener('click', () => {
                        wrapper.remove();
                        window.location.href = 'https://www.facebook.com/messages';
                    });
                }
                document.body.appendChild(wrapper);
            }

            if (styleElement) styleElement.remove();
            if (mediaStyleElement) mediaStyleElement.remove();
        }
    } else {
        if (styleElement) styleElement.remove();
        if (mediaStyleElement) mediaStyleElement.remove();
        if (directMediaStyleElement) directMediaStyleElement.remove();
        if (closeBtnElement) closeBtnElement.remove();
        if (dynamicWidthElement) dynamicWidthElement.remove();
    }
    
    updateScrollBarMode(appSettings.hideScrollBar);
}

function injectFacebookButton() {
    if (!window.location.href.includes('facebook.com/messages') || !appSettings.showFbButton) {
        const existingBtn = document.querySelector('.custom-fb-btn');
        if (existingBtn && !appSettings.showFbButton) existingBtn.parentElement.remove();
        return;
    }
    
    if (document.querySelector('.custom-fb-btn')) return;

    const settingsBtn = document.querySelector('[aria-label="Settings, help and more"]');
    const newMsgBtn = document.querySelector('[aria-label="New message"]');

    if (!settingsBtn || !newMsgBtn) return;

    const settingsWrapper = settingsBtn.parentElement.parentElement;
    const newMsgWrapper = newMsgBtn.parentElement.parentElement;

    const newFacebookWrapper = newMsgWrapper.cloneNode(true);
    const newLink = newFacebookWrapper.querySelector('a, [role="link"], [role="button"]') || newFacebookWrapper.firstElementChild;

    if (newLink) {
        newLink.href = 'https://www.facebook.com';
        newLink.target = '_blank';
        newLink.rel = 'noopener noreferrer';
        newLink.setAttribute('aria-label', 'Open Facebook');
        newLink.classList.add('custom-fb-btn');

        const facebookSvg = `<svg viewBox="6 6 24 24" fill="currentColor" width="20" height="20" aria-hidden="true" class="x14rh7hd x1lliihq x1tzjh5l" overflow="visible" style="--x-color: var(--primary-icon);"><path d="M18 7c6.075 0 11 4.925 11 11 0 5.49-4.023 10.041-9.281 10.866V21.18h2.563L22.77 18h-3.051v-2.063c0-.87.426-1.718 1.792-1.718h1.387v-2.707s-1.258-.215-2.462-.215c-2.512 0-4.155 1.523-4.155 4.28V18h-2.793v3.18h2.793v7.686C11.023 28.041 7 23.49 7 18c0-6.075 4.925-11 11-11z"></path></svg>`;
        
        const existingSvg = newLink.querySelector('svg');
        if (existingSvg) existingSvg.outerHTML = facebookSvg;
    }

    if (!document.getElementById('custom-fb-hover-styles')) {
        const style = document.createElement('style');
        style.id = 'custom-fb-hover-styles';
        style.innerHTML = `
            .custom-fb-btn { transition: background-color 0.1s ease; border-radius: 50%; }
            html:not(.__fb-dark-mode) .custom-fb-btn:hover { background-color: rgba(0, 0, 0, 0.1) !important; }
            html.__fb-dark-mode .custom-fb-btn:hover, .__fb-dark-mode .custom-fb-btn:hover { background-color: rgba(255, 255, 255, 0.25) !important; }
        `;
        document.head.appendChild(style);
    }

    if (settingsWrapper.parentElement) {
        settingsWrapper.parentElement.insertBefore(newFacebookWrapper, settingsWrapper);
    }
}

function autoPlayGifs() {
    if (!window.location.href.includes('facebook.com/messages') || !appSettings.autoPlayGifs) return;
    const playButtons = document.querySelectorAll('div[aria-label^="Tap to play GIF"][role="button"]:not([data-messengerify-clicked])');
    playButtons.forEach(btn => {
        btn.setAttribute('data-messengerify-clicked', 'true');
        btn.click(); 
    });
}

applyOrRemoveStyle();

let lastUrl = location.href;
const observer = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        applyOrRemoveStyle();
    }
    injectFacebookButton();
    autoPlayGifs();
});

const startObserving = () => {
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
        applyOrRemoveStyle();
        injectFacebookButton();
        autoPlayGifs();
    } else {
        requestAnimationFrame(startObserving);
    }
};
startObserving();

window.addEventListener('popstate', () => {
    applyOrRemoveStyle();
    injectFacebookButton();
    autoPlayGifs();
});
