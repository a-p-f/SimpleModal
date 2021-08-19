function fixFocus(iframe) {
    const active = document.activeElement;
    if (!active) return;

    // Don't let any previous siblings of iframe (or descendants thereof) gain focus
    if (
        iframe.parentElement.compareDocumentPosition(active) & Node.DOCUMENT_POSITION_CONTAINED_BY
        && iframe.compareDocumentPosition(active) & Node.DOCUMENT_POSITION_PRECEDING
    ) {
        iframe.focus();
    }
}
export function init(layer) {
    layer._initiallyFocused = document.activeElement;
    layer.iframe.focus();
    layer._fixFocus = fixFocus.bind(null, layer.iframe);
    layer.iframe.parentElement.addEventListener('focus', layer._fixFocus, true);
}
export function release(layer) {
    layer.iframe.parentElement.removeEventListener('focus', layer._fixFocus, true);
    layer._initiallyFocused && layer._initiallyFocused.focus();
}