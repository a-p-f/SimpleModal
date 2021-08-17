import * as hashConfig from './hashConfig.js';
import makeIframe from './makeIframe.js';
import {lockScroll, releaseScroll} from './lockScroll.js';
import {isObject, getMessage} from './utils.js';

const layers = [];
let initialActiveElement;

function is_same_origin(iframe) {
    return Boolean(iframe.contentDocument);
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

    // Only needed on first load, but no harm running every load
    layer.iframe.style.opacity = '';
    if (layer.replaces) {
        resolve(layer.replaces);
        layer.replaces = null;
    }

    // Seems to be needed in IE - iframe blurs when it reloads
    // We want to be sure to run it now, before we call the onload callback (rather than waiting for our focus listener)
    focusTopIfNeeded();

    layer.onload && layer.onload(layer.iframe.contentWindow);
}
function getActiveElement() {
    let c = document.activeElement;
    // If the activeElement is an iframe, try to descend into the iframe
    // If we reach a cross-origin iframe, error will be thrown
    try {
        while (c && c.contentDocument && c.contentDocument.activeElement) {
            c = c.contentDocument.activeElement;
        }
    } catch(e) {}
    return c;
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
export function open(layer, src, {animate=true}={}) {
    if (layers.length == 0) {
        initialActiveElement = getActiveElement();
        lockScroll();
        attachGlobalListeners();
    }
    layers.push(layer);
    const iframe = layer.iframe;
    document.body.appendChild(iframe);
    iframe.addEventListener('load', layerLoaded.bind(null, layer));
    iframe.focus();
    iframe.src = hashConfig.setting(src, {animate});
}
export function resolve(layer, value) {
    // Remove it from list
    const index = layers.indexOf(layer);
    if (index==-1) throw new Error('Layer is not in layers.');
    layers.splice(index, 1);

    layer.iframe.parentElement && layer.iframe.parentElement.removeChild(layer.iframe);
    if (layers.length == 0) {
        releaseScroll();
        initialActiveElement && initialActiveElement.focus();
        detachGlobalListeners();
    }
    else {
        focusTopIfNeeded();
    }
    layer.onclose && layer.onclose(value);
    layer.promiseResolver && layer.promiseResolver(value);
}
export function replace(layer, url) {
    const next = {
        sandbox: layer.sandbox,
        iframe: makeIframe(layer.sandbox),
        onload: layer.onload,
        onclose: layer.onclose,
        promiseResolver: layer.promiseResolver,
    }

    // Ensure nothing happens when remove current, or if it loads again
    layer.onload = null;
    layer.onclose = null;
    layer.promiseResolver = null;

    next.replaces = layer;
    open(next, url, {animate: false});
}
function attachGlobalListeners() {
    document.documentElement.addEventListener('focus', focusTopIfNeeded, true);
    addEventListener('message', handleChildMessages);
}
function detachGlobalListeners() {
    document.documentElement.removeEventListener('focus', focusTopIfNeeded, true);
    removeEventListener('message', handleChildMessages);
}
// TODO - play nice with other "dynamic overlays" - if focus moved to an element after iframe in DOM, then do nothing
function focusTopIfNeeded() {
    const layer = top();
    if (layer && layer.iframe != document.activeElement) layer.iframe.focus();
}
function handleChildMessages() {
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
}
