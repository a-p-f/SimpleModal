import * as aria from './aria.js';
import * as positioning from './positioning.js';
import * as scrollLocking from './scrollLocking.js';
import * as focus from './focus.js';

import {isObject, getMessage, postMessage} from './utils.js';

const layers = [];
function makeIframe(sandbox) {
    const iframe = document.createElement('iframe');
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

    const color = getComputedStyle(iframe.contentDocument.documentElement).backgroundColor;
    return color == 'transparent' || color == 'rgba(0, 0, 0, 0)';
}
function layerLoaded(layer) {
    const iframe = layer.iframe;
    // Server-generated error pages won't have any background color.
    // It's really confusing when these load as a modal layer.
    // To help with that, if the background of the <html> element is totally transparent, we'll set a background color on the iframe
    iframe.style.backgroundColor = should_set_opaque_background(iframe) ? 'white' : '';

    if (layer.replaces) {
        postMessage(layer.iframe.contentWindow, 'CANCEL_SIMPLE_MODAL_ANIMATIONS');
        // Don't reveal until it tells us it has canceled animations
    }
    else {
        // Only needed on first load, but no harm running every load
        reveal(iframe);
    }
    // Seems to be needed in IE - iframe blurs when it reloads
    // We want to be sure to focus it now, before we call the onload callback (rather than waiting for our focus listener)
    if (iframe != document.activeElement) iframe.focus();

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
export function open(layer, src) {
    const iframe = makeIframe(layer.sandbox);
    layer.iframe = iframe;
    layers.push(layer);

    scrollLocking.init(layer);
    positioning.init(layer);
    focus.init(layer);
    aria.init(layer);

    iframe.addEventListener('load', layerLoaded.bind(null, layer));
    iframe.src = src;
}
export function resolve(layer, value) {
    // Remove it from list
    const index = layers.indexOf(layer);
    if (index==-1) throw new Error('Layer is not in layers.');
    layers.splice(index, 1);

    aria.release(layer);
    focus.release(layer);
    positioning.release(layer);
    scrollLocking.release(layer);

    layer.onclose && layer.onclose(value);
    layer.promiseResolver && layer.promiseResolver(value);
}
export function replace(layer, url) {
    const next = {
        sandbox: layer.sandbox,
        onload: layer.onload,
        onclose: layer.onclose,
        promiseResolver: layer.promiseResolver,
    }

    // Ensure nothing happens when remove current, or if it loads again
    layer.onload = null;
    layer.onclose = null;
    layer.promiseResolver = null;

    next.replaces = layer;
    open(next, url);
}
export function updatePositions() {
    for (var i = 0; i < layers.length; i++) {
        positioning.update(layers[i]);
    }
}
addEventListener('message', function(event) {
    const layer = layerForWindow(event.source);
    if (!layer) return
    
    const data = event.data;

    // x-origin child explicitly asked to be closed
    if (getMessage(data) == 'CLOSE_SIMPLE_MODAL_CHILD') {
        resolve(layer, event.data.value);
        closeChild(event.data.value);
    }
    if (getMessage(data) == 'REPLACE_SIMPLE_MODAL') {
        replace(layer, data.url);
    }
    if (getMessage(data) == 'SIMPLE_MODAL_ANIMATIONS_CANCELED') {
        reveal(layer.iframe);
        resolve(layer.replaces);
        layer.replaces = null;
    }
});
