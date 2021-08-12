/*
    SimpleModalAnimator.js

    For use with SimpleModal.js (in a child window).

    ONLY animates the first page loaded in a SimpleModal.
    ONLY animates an explicit call to SimpleModal.close()
    - no exit animation if the parent window closes the SimpleModal

    On first appearance, html element has:
        class="SimpleModal-animating SimpleModal-opening"

    After the entrance animation, classes are removed.
    
    On close, html element has:
        class="SimpleModal-animating SimpleModal-closing" 

    Use these classes to define appropriate animation properties.

    Important:
    You MUST set an animation-duration on the <html> element. That's the element we check to know when the animation completes.

    Tip:
    .SimpleModal-animating {
        // define most animation properties here
    }
    .SimpleModal-closing {
        animation-direction: reverse;
        // make sure the offscreen state persists after animation completes, while window is closed
        animation-fill-mode: forwards;
    }

    Tip:
    Your animation shouldn't generally need to duplicate your "default" properties at the 100% keyframe.
    However, if you don't have the property defined anywhere in your stylesheets, you may need to set it explicitly, or the animation may break in Safari under certain circumstances.
*/
(function() {
'use strict';

function after_html_animation(callback) {
    var h = document.documentElement;
    var animation_seconds = parseFloat(getComputedStyle(h).animationDuration);
    setTimeout(callback, animation_seconds*1000);
}

// This is definitely not a modal window - nothing to do
if (window.parent == window) return

/*
    Notice - read/set window.name to differentiate between the first load and subsequent loads in this modal layer.

    We only want to animate the first appearance.

    This means you can't use window.name for any other purpose.
*/
var ALREADY_LOADED = 'ALERT_MODAL_ALREADY_LOADED';
if (window.name != ALREADY_LOADED) {
    window.name = ALREADY_LOADED

    var h = document.documentElement;

    // Wait for load event before revealing - make sure stylesheets have loaded and have been applied
    addEventListener('load', function() {
        h.classList.add('SimpleModal-opening');
        h.classList.add('SimpleModal-animating');
        after_html_animation(function() {
            h.classList.remove('SimpleModal-opening');
            h.classList.remove('SimpleModal-animating');
        });
    });
}

/*
    Patch SimpleModal.close to animate this window out
*/
var _SimpleModal_close = SimpleModal.close.bind(SimpleModal);
window.SimpleModal.close = function(value, then) {
    var h = document.documentElement;
    h.classList.add('SimpleModal-closing');
    h.classList.add('SimpleModal-animating');
    after_html_animation(function() {
        _SimpleModal_close(value, then);
    });
}

})()