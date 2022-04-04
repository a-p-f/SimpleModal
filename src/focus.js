/*
Responsible for:
- preventing focus of "covered" elements
- focusing layers when opened/reloaded
- restoring focus when layers are closed
*/

import * as u from './utils.js';

/*
    Prevent programmatic/browser-automatic focusing of covered elements.
    
    We shouldn't have to do this, but we found a case (hard to reproduce), where Safari was focusing a username input on the parent page when it had a modal open. This feature is mainly to protect against that.
*/
addEventListener('focus', function(event) {
    if (event.target.hasOwnProperty('_SimpleModalInitialTabIndex')) {
        event.target.blur();
    }
}, true);


// Fairly inclusive list of (potentially) focusable elements.
// I used this for guidance: https://allyjs.io/data-tables/focusable.html
const POTENTIALLY_FOCUSABLE = 'a,button,input,textarea,select,summary,[contenteditable],area,audio,video,object,embed,svg,iframe';

function getPotentiallyFocusableChildren(layer) {
    return (layer.container || document.body).querySelectorAll(POTENTIALLY_FOCUSABLE);
}
function block(e) {
    // Do nothing if already blocked
    if (e.hasOwnProperty('_SimpleModalInitialTabIndex')) return

    e._SimpleModalInitialTabIndex = e.getAttribute('tabindex');
    e.setAttribute('tabindex', -1);
}
function unblock(e) {
    const v = e._SimpleModalInitialTabIndex;

    // This element wasn't blocked by us. Leave tabindex alone.
    if (typeof v == 'undefined') return

    if (v == null) e.removeAttribute('tabindex');
    else e.setAttribute('tabindex', v);
    delete e._SimpleModalInitialTabIndex;
}
export function init(layer, isFirstLayer) {
    /*
        TODO - users might not be happy to have us messing with tabindex (even if only temporarily).
        We should offer an option to opt-out
    */
    const focusable = getPotentiallyFocusableChildren(layer);
    for (let i = focusable.length - 1; i >= 0; i--) {
        if (focusable[i] != layer.iframe) block(focusable[i]);
    }

    if (layer.replaces) {
        layer.initialActiveElement = layer.replaces.initialActiveElement;

        // This one shouldn't change focus when it's released
        layer.replaces.initialActiveElement = null;
    }
    else {
        layer.initialActiveElement = document.activeElement;
    }

    layer.iframe.focus();
}
function is_covered(e, excluding) {
    let cursor = e;
    while (cursor = cursor.nextElementSibling) {
        if (cursor._isSimpleModalIframe && cursor != excluding) return true
    }
    if (e.parentElement) return is_covered(e.parentElement, excluding);
    return false;
}

// TODO - more efficient algorithm? Could work top-down/backwards
// Getting it right in all scenarios (including concurrent modals, in different containers) isn't straight-forward
// This is a bit of a brute-force approach, but it should be correct
export function release(layer) {
    const focusable = document.querySelectorAll(POTENTIALLY_FOCUSABLE);
    for (let i = focusable.length - 1; i >= 0; i--) {
        const e = focusable[i];
        // Note - our iframe might not have been removed yet. Be sure we don't count it in the is_covered check
        if (!is_covered(e, layer.iframe)) unblock(e);
    }
    const ae = layer.initialActiveElement;

    if (
        ae
        // exclude anything we've explicitly disabled
        // We can't naively check against tabindex (property or attribute), because the previous ae might actually have had a negative tab index.
        && !ae.hasOwnProperty('_SimpleModalInitialTabIndex')
        // Some browsers report document.body as document.activeElement when nothing is focused
        // We don't want to focus that (might cause scrolling)
        && ae != document.body
    ) ae.focus();
 }