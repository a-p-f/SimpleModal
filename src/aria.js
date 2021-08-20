import * as u from './utils.js';

function hide_element(element) {
    if (element._SimpleModalAriaInitialized) return
    element._SimpleModalAriaInitialized = true
    element._SimpleModalInitialAriaHidden = element.getAttribute('aria-hidden');
    element.setAttribute('aria-hidden', 'true');
}
function release_element(element) {
    if (!element._SimpleModalAriaInitialized) return
    const hidden = element._SimpleModalInitialAriaHidden;
    if (hidden === null) {
        element.removeAttribute('aria-hidden');
    }
    else {
        element.setAttribute('aria-hidden', hidden);
    }
    delete element._SimpleModalAriaInitialized;
    delete element._SimpleModalInitialAriaHidden;
}

export function init(layer) {
    const iframe = layer.iframe;
    iframe.setAttribute('role', 'dialog');

    // Set aria-hidden on each previous sibling of iframe, storing initial values
    u.initPreviousSiblings(layer.iframe, hide_element);
}
export function release(layer) {
    // restore initial aria-hidden values (unless still locked by another layer)
    u.releasePreviousSiblings(layer.iframe, release_element);
}
