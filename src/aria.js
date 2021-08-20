// TODO - this can be simplified via utils.initPreviousSiblings and utils.releasePreviousSiblings
function hide_element(element) {
    element._SimpleModalAriaHiddenCount = (element._SimpleModalAriaHiddenCount||0) + 1;
    if (element._SimpleModalAriaHiddenCount == 1) {
        element._SimpleModalInitialAriaHidden = element.getAttribute('aria-hidden');
        element.setAttribute('aria-hidden', 'true');
    }
}
function release_element(element) {
    element._SimpleModalAriaHiddenCount--;
    if (element._SimpleModalAriaHiddenCount == 0) {
        const hidden = element._SimpleModalInitialAriaHidden;
        if (hidden === null) {
            element.removeAttribute('aria-hidden');
        }
        else {
            element.setAttribute('aria-hidden', hidden);
        }
    }
}
export function init(layer) {
    const iframe = layer.iframe;
    iframe.setAttribute('role', 'dialog');

    // Set aria-hidden on each previous sibling of iframe, storing initial values
    let cursor = iframe;
    while (cursor = cursor.previousElementSibling) {
        hide_element(cursor);
    }
}
export function release(layer) {
    // restore initial aria-hidden values (unless still locked by another layer)
    let cursor = layer.iframe;
    while (cursor = cursor.previousElementSibling) {
        release_element(cursor);
    }
}
