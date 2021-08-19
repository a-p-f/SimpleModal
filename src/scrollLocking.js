/*
    This may be overly complicated.
    In most situations, we just want to replicate the behaviour of 
        overscroll-behaviour: contain
    but browser support isn't great yet, and I don't know if it even works on iframes.

    In certain situtations, that isn't even the behaviour we want.
    Imagine:
    HEADER
    --------------------------
            |  
    SIDEBAR | MAIN
            |  
            |  
            |  

    And the modal is set to cover MAIN.
    Here, if the entire page scrolls (ie. because sidebar is long), we want to let the page scroll.
    If MAIN scrolls, however, we _do_ want to lock it.
*/
function ScrollLock(element) {
    const style = element.style;
    let count = 0;
    let scrollTop, scrollLeft, overflowX, overflowY, maxWidth;

    function fixScroll() {
        element.scrollTop = scrollTop;
        element.scrollLeft = scrollLeft;
    }
    function increment() {
        count++;
        if (count==1) lock();
    }
    function decrement() {
        count--;
        if (count==0) unlock();
    }
    function lock() {
        scrollTop = element.scrollTop;
        scrollLeft = element.scrollLeft;

        // Save values so we can restore
        overflowX = style.overflowX;
        overflowY = style.overflowY;
        maxWidth = style.maxWidth;

        /*
            Lock element dimensions.
            In some browsers/configurations, toggling overflow will cause scrollbars to hide.
            Lock dimensions so that the document doesn't reflow.
        */
        style.maxWidth = element.clientWidth + 'px';

        // Lock scrolling
        // ONLY lock if element actually "has a scrollbar"
        // Otherwise, we can change how margin collapsing works, if the element currently has no overflow
        if (element.scrollWidth > element.clientWidth) style.overflowX = 'hidden';
        if (element.scrollHeight > element.clientHeight) style.overflowY = 'hidden';

        /*
            Note - even though we've set overflow hidden, that doesn't stop programmatic scrolling.
            If the modal's initial content is positioned offscreen (ie. if it is going to animate into view), then some browsers (safari) may try to scroll the container to put the child window in view.
            So we still need a scroll listener  to reset such browser-induced scrolling.
        */
        element.addEventListener('scroll', fixScroll);
    }
    function unlock() {
        style.maxWidth = maxWidth;
        style.overflowX = overflowX;
        style.overflowY = overflowY;

        element.removeEventListener('scroll', fixScroll);
    }
    return {increment, decrement}
}

function increment_lock(element) {
    element._SimpleModalScrollLock = element._SimpleModalScrollLock || ScrollLock(element);
    element._SimpleModalScrollLock.increment();
}
function decrement_lock(element) {
    element._SimpleModalScrollLock.decrement();
}
function elements_to_lock(layer) {
    /*
        In the "normal" situation, we're appending iframe to body, but "covering" the entire <html> element. 

        Depending on style/layout, scrollbar could be on <html>, <body>, or both.
        So we need to lock both.
    */
    if (layer.container) return [layer.container]
    return [document.documentElement, document.body];
}
export function init(layer) {
    elements_to_lock(layer).forEach(increment_lock);
}
export function release(layer) {
    elements_to_lock(layer).forEach(decrement_lock);
}