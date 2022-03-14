import * as aria from './aria.js';
import * as positioning from './positioning.js';
import * as scrollLocking from './scrollLocking.js';
import * as focus from './focus.js';
import * as u from './utils.js';

import {isObject, getMessage, postMessage} from './utils.js';

const layers = [];
function makeIframe(sandbox) {
    const iframe = document.createElement('iframe');

    // Not used by us anywhere, but can be useful for external code to identify our iframes
    iframe.classList.add('SimpleModalIframe');

    iframe._isSimpleModalIframe = true;
    
    const s = iframe.style;

    // Don't make the iframe visible until it has loaded
    // This makes it easier to animate in
    // Use opacity, rather than visibility, because browser don't let you focus hidden elements
    // May be more performant to toggle opacity, too
    // s.visibility = 'hidden';
    s.opacity = 0;

    if (sandbox !== null) {
        iframe.setAttribute('sandbox', sandbox);
    }
    return iframe;
}
function reveal(iframe) {
    iframe.style.opacity = '';
}
function is_same_origin(iframe) {
    try {
        return Boolean(iframe.contentDocument);
    } catch(e) {return false}
}
function should_set_opaque_background(iframe) {
    // If the iframe is x-origin, we cannot  test the html element.
    // Have to assume the users have set it properly.
    if (!is_same_origin(iframe)) return false; 

    const s = getComputedStyle(iframe.contentDocument.documentElement);
    const bc = s.backgroundColor;
    return (bc == 'transparent' || bc == 'rgba(0, 0, 0, 0)') && s.backgroundImage == 'none';
}
function layerLoaded(layer) {
    const iframe = layer.iframe;
    // Server-generated error pages won't have any background color.
    // It's really confusing when these load as a modal layer.
    // To help with that, if the background of the <html> element is totally transparent, we'll set a background color on the iframe
    iframe.style.backgroundColor = should_set_opaque_background(iframe) ? 'white' : '';

    if (layer.replaces) {
        postMessage(iframe.contentWindow, 'CANCEL_SIMPLE_MODAL_ANIMATIONS');
        // Don't reveal until it tells us it has canceled animations
    }
    else {
        // Only needed on first load, but no harm running every load
        reveal(iframe);
    }

    // Seems to be needed in IE - iframe blurs when it reloads
    // We want to be sure to focus it now, before we call the onload callback (rather than waiting for our focus listener)
    if (iframe != document.activeElement && iframe.tabindex != -1) {
        iframe.focus();
    }
    postMessage(iframe.contentWindow, 'SIMPLE_MODAL_LOADED_AND_REFOCUSED');

    layer.onload && layer.onload(layer.iframe.contentWindow);
}
export function layerForWindow(w) {
    for (let i = 0; i < layers.length; i++) {
        if (layers[i].iframe.contentWindow == w) return layers[i];
    }
}
export function top() {
    // Notice - will be undefined if no layers open
    return layers[layers.length-1];
}
function addBackdrop(layer) {
    const backdrop = document.createElement('div');
    backdrop.classList.add('SimpleModalBackdrop');
    backdrop.classList.add('animating');
    positioning.init(backdrop, layer.container);
    u.afterAnimation(backdrop, function() {
        backdrop.classList.remove('animating');
    });
    layer.backdrop = backdrop;
}
export function open(layer, src) {
    // If this layer is replacing another, it will already have a backdrop
    if (!layer.backdrop) addBackdrop(layer);

    const iframe = makeIframe(layer.sandbox);
    layer.iframe = iframe;
    layers.push(layer);

    const isFirstLayer = layers.length == 1;

    scrollLocking.init(layer);
    iframe.src = src;
    positioning.init(layer.iframe, layer.container);
    focus.init(layer, isFirstLayer);
    aria.init(layer);

    /*
        We _should_ be able to do this.
        However, we've run into issues when integrating on external sites, where 3rd party code call stopPropagation on the load event.
        By using a capturing event listener (on document), this issue is less likely to arise.
    */
    // iframe.addEventListener('load', layerLoaded.bind(null, layer));
}
document.addEventListener('load', function(e) {
    const w = e.target.contentWindow;
    const layer = w && layerForWindow(w);
    if (layer) layerLoaded(layer);
}, true);

export function resolve(layer, value) {
    // Remove it from list
    const index = layers.indexOf(layer);
    if (index==-1) throw new Error('Layer is not in layers.');
    layers.splice(index, 1);

    // If the layer still has a backdrop, remove it
    const backdrop = layer.backdrop;
    if (backdrop) removeBackdrop(backdrop, layer.container);

    const isLastLayer = layers.length == 0;

    aria.release(layer);
    focus.release(layer, isLastLayer);
    positioning.release(layer.iframe, layer.container);
    scrollLocking.release(layer);

    layer.onclose && layer.onclose(value);
    layer.promiseResolver && layer.promiseResolver(value);
}
export function replace(layer, url, animated=false) {
    const next = {
        sandbox: layer.sandbox,
        onload: layer.onload,
        onclose: layer.onclose,
        promiseResolver: layer.promiseResolver,
        container: layer.container,
        backdrop: layer.backdrop,
    }

    // Ensure nothing happens when remove current, or if it loads again
    layer.onload = null;
    layer.onclose = null;
    layer.promiseResolver = null;
    layer.backdrop = null;

    if (animated) {
        // Close current layer, opening the next one after exit animation runs
        layer.onclose = open.bind(null, next, url);
        resolve(layer);
    }
    else {
        // Open the next layer, and have it replace the current one without animation once loaded
        next.replaces = layer;
        open(next, url);
    }
}
export function updatePositions() {
    for (var i = 0; i < layers.length; i++) {
        positioning.update(layers[i].iframe, layers[i].container);
    }
}
function animateBackdropOut(layer) {
    const backdrop = layer.backdrop;
    if (!backdrop) return

    // tell resolve not remove the backdrop - let the exit animation finish
    layer.backdrop = null;

    backdrop.classList.add('animating');
    backdrop.classList.add('closing');
    u.afterAnimation(backdrop, removeBackdrop.bind(null, backdrop, layer.container));
}
function removeBackdrop(backdrop, container) {
    positioning.release(backdrop, container);
}
addEventListener('message', function(event) {
    const layer = layerForWindow(event.source);
    if (!layer) return
    
    const data = event.data;

    // x-origin child explicitly asked to be closed
    if (getMessage(data) == 'CLOSE_SIMPLE_MODAL_CHILD') {
        resolve(layer, event.data.value);
    }
    if (getMessage(data) == 'REPLACE_SIMPLE_MODAL') {
        replace(layer, data.url, data.animated);
    }
    if (getMessage(data) == 'SIMPLE_MODAL_ANIMATIONS_CANCELED') {
        reveal(layer.iframe);
        resolve(layer.replaces);
        layer.replaces = null;
    }
    if (getMessage(data) == 'ANIMATE_SIMPLE_MODAL_BACKDROP_OUT') {
        animateBackdropOut(layer);
    }
});
