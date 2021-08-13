import config from './config.js';

// Listen to messages from parent
if (window.parent != window) {
    addEventListener('message', function(event) {
        if (event.source != window.parent) return

        if (event.data == 'SIMPLE_MODAL_CHILD_LOADED') {
            window.parent.postMessage({
                simple_modal_child_titled: document.title, 
            }, '*');
        }
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
if (config.animate) {
    /*
       Wait for load event before revealing - make sure stylesheets have loaded and have been applied
       Otherwise, 2 issues:
       - we might animate before page is ready (before iframe is visible in parent) and user won't see it
       -  getComputedStyle in after_html_animation may block (waiting on stylesheets), blocking all "before-load" scripts
    */
    if (document.querySelector('[autofocus]')) {
        /*
            Note - Safari seems to focus [autofocus] elements, even though this is an iframe. That broke our entrance animation on another site, but we haven't yet been able to replicate it. Seems to depend on page structure.
        */
        console.warn('autofocus not recommended when using SimpleModal animations. Can sometimes break animations in Safari, but only in certain situations.');
    }
    addEventListener('load', function() {
        let h = document.documentElement;
        h.classList.add('SimpleModal-opening');
        h.classList.add('SimpleModal-animating');
        after_html_animation(function() {
            h.classList.remove('SimpleModal-opening');
            h.classList.remove('SimpleModal-animating');
            config.autofocus && autofocus();
        });
    });
}
else {
    config.autofocus && autofocus();
}
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
        simple_modal_replace_url: url,
    });
}
export function reload() {
    replace(location.href);
}
