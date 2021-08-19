import config from './config.js';
import {isObject, getMessage, postMessage} from './utils.js';

// Listen to messages from parent
if (window.parent != window) {
    addEventListener('message', function(event) {
        if (event.source != window.parent) return
        const data = event.data;

        if (getMessage(data) == 'CANCEL_SIMPLE_MODAL_ANIMATIONS') {
            if (config.animate) {
                cancel_animations();
            }
            postMessage(window.parent, 'SIMPLE_MODAL_ANIMATIONS_CANCELED');
        }
    });
    trackAndRestoreFocus();
}

function trackAndRestoreFocus() {
    // track active element within this iframe
    let ae = document.activeElement;
    document.documentElement.addEventListener('focus', function() {
        ae = document.activeElement;
    }, true);

    // when iframe regains focus, re-focus the correct element
    addEventListener('focus', function() {
        ae && ae.focus();
    });
}

export function autofocus() {
    const target = document.querySelector('[simple-modal-autofocus]');
    target && target.focus();
}

function after_html_animation(callback) {
    var h = document.documentElement;
    var animation_seconds = parseFloat(getComputedStyle(h).animationDuration);
    setTimeout(callback, animation_seconds*1000);
}

/*
    Wait for load event for multiple reasons:
    - ensure layout is finished before we start animation
    -  getComputedStyle in after_html_animation may block (waiting on stylesheets), blocking all "before-load" scripts
    - support autofocusing of dynamically added elements (as long as they are present before we run)
*/
let animations_canceled = false;
function cancel_animations() {
    if (animations_canceled) return;
    animations_canceled = true;
    const h = document.documentElement;
    h.classList.remove('SimpleModal-opening');
    h.classList.remove('SimpleModal-animating');
    config.autofocus && autofocus();
}
addEventListener('load', function() {
    if (config.animate) {
        if (document.querySelector('[autofocus]')) {
            /*
                Note - Safari seems to focus [autofocus] elements, even though this is an iframe. That broke our entrance animation on another site, but we haven't yet been able to replicate it. Seems to depend on page structure.
            */
            console.warn('autofocus not recommended when using SimpleModal animations. Can sometimes break animations in Safari, but only in certain situations.');
        }
        const h = document.documentElement;
        h.classList.add('SimpleModal-opening');
        h.classList.add('SimpleModal-animating');
        after_html_animation(function() {
            cancel_animations();
        });
    }
    else {
        config.autofocus && autofocus();
    }
});

export function animateOut(then) {
    var h = document.documentElement;
    h.classList.add('SimpleModal-closing');
    h.classList.add('SimpleModal-animating');
    after_html_animation(then);
}

function assertIframed() {
    if (window.parent == window) throw new Error('This is not a SimpleModal child window (it\'s not even in iframe)');
}
function isSameOrigin() {
    try {
        return Boolean(window.parent.location.hostname)
    }
    catch (e) {
        return false;
    }
}
function requiredLayerInParent() {
    const layer = window.parent.SimpleModal && window.parent.SimpleModal.layerForWindow(window);
    if (!layer) throw new Error("This is not a SimpleModal child window");
    return layer
}
function _close(value=null, then=null) {
    assertIframed();

    if (isSameOrigin()) {
        const layer = requiredLayerInParent();
        window.parent.SimpleModal.resolveLayer(layer, value);
        then && then();
        return
    }

    /*
        Parent is x-origin.
        Can't be sure we're a SimpleModal child.
        Just try to close.
        If we're not a SimpleModal child, parent will (probably) just ignore this message, and nothing will happen.
    */
    if (then) {
        /* 
            For same-origin, we can invoke the callback synchronously.
            For x-origin, we tried using postMessage to have the child call the function, but that doesn't work.
            The child window seems to get cleaned up as soon as we post the message.
            _perhaps_ we could support it if we stored a reference to the child window after we posted the message, but I don't think we should rely on a disconnected iframe receiving message events and running code.

            Also, there isn't much useful that a cross-origin iframe could do in this state, anyway. The main purpose of "then" is to allow the (closed) child to navigate the parent.
        */
        throw new Error('"then" callback to SimpleModal.close is not supported in cross origin layers.');
    }

    parent.postMessage({
        value: value,
        message: 'CLOSE_SIMPLE_MODAL_CHILD',
    }, '*');
}
export function close(value=null, then=null) {
    function do_close() {
        _close(value, then);
    }
    if (config.animate) {
        animateOut(do_close);
    }
    else {
        do_close();
    }
}
export function replace(url) {
    parent.postMessage({
        message: 'REPLACE_SIMPLE_MODAL',
        url: url,
    }, '*');
}
export function reload() {
    replace(location.href);
}
