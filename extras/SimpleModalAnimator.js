/*
    SimpleModalAnimator.js

    For use with SimpleModal.js (in a child window).

    ONLY animates the first page loaded in a SimpleModal.
    ONLY animates an explicit call to SimpleModal.close()
    - no exit animation if the parent window closes the SimpleModal

    On first appearance, html element transitions from:
        class="SimpleModal-animating SimpleModal-opening SimpleModal-out" 
    to:
        class="SimpleModal-animating SimpleModal-opening" 

    After the entrance transition, "SimpleModal-animating" and "SimpleModal-opening" classes are removed.
    
    On close, html element transitions from:
        class="SimpleModal-animating SimpleModal-closing" 
    to:
        class="SimpleModal-animating SimpleModal-closing SimpleModal-out" 

    You must ONLY define your transitions when .SimpleModal-animating
    or .SimpleModal-opening/.SimpleModal-closing are present.

    Also, you MUST set a transition-duration on <html> when these classes are present, if you don't animate any properties on that element. Our code looks at the transition duration of that element to determine how long the transition takes.
*/
(function() {
'use strict';

function after_html_transition(callback) {
    /*
        Note: transitionend events are rather unreliable, so we read computed
        transition-duration style value from <html>.

        If you're animating some other element (ie. <body>), 
        be sure to set a matching transition duration on <html>

        Ie: html {transition: none 0.3s}
    */
    var h = document.documentElement;
    var transition_seconds = parseFloat(getComputedStyle(h).transitionDuration);
    setTimeout(callback, transition_seconds*1000);
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

    // Up to you to define "off screen" styles when <html> has this class
    h.classList.add('SimpleModal-out');

    // Wait for load event before revealing - make sure stylesheets have loaded and have been applied
    addEventListener('load', function() {
        /*
            Note: we cannot set these before load.

            If we do, some browsers will actually animate the window out (animate the style change triggered by adding SimpleModal-out, even when setting these classes after that one). 
        */
        h.classList.add('SimpleModal-animating');
        h.classList.add('SimpleModal-opening');

        after_html_transition(function() {
            h.classList.remove('SimpleModal-animating');
            h.classList.remove('SimpleModal-opening');
        });

        h.classList.remove('SimpleModal-out');
    });
}

/*
    Patch SimpleModal.close to animate this window out
*/
var _SimpleModal_close = SimpleModal.close.bind(SimpleModal);
window.SimpleModal.close = function(value, then) {
    var h = document.documentElement;
    h.classList.add('SimpleModal-animating');
    h.classList.add('SimpleModal-leaving');

    after_html_transition(function() {
        _SimpleModal_close(value, then);
    });

    h.classList.add('SimpleModal-out');
}

})()