import * as u from './utils.js';

let active1, active2 = document.body;
function trackDirection() {
    active1 = active2;
    active2 = document.activeElement || document.body;
}
function focusMovedBackward() {
    return active1.compareDocumentPosition(active2) & Node.DOCUMENT_POSITION_PRECEDING
}
function hasSkipFocusAncestor(e) {
    while (e) {
        if (e._SimpleModalSkipFocus) return true
        e = e.parentElement
    }
}
function handleFocusChange(e) {
    trackDirection();

    if (!hasSkipFocusAncestor(document.activeElement)) return

    const backward = focusMovedBackward();
    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_ELEMENT, focusableNodeFilter);
    walker.currentNode = document.activeElement;

    const next = backward ? walker.previousNode.bind(walker) : walker.nextNode.bind(walker);

    // We found (and focused!) an element while moving in the given direction
    if (next()) return

    // We didn't find anything more appropriate to focus. 
    document.activeElement.blur();
}
const focusableNodeFilter = {
    acceptNode: function(node) {
        // reject this node and all of it's descendants
        if (hasSkipFocusAncestor(node)) return NodeFilter.FILTER_REJECT

        // Try to focus it, see if it works
        node.focus()
        if (node == document.activeElement) return NodeFilter.FILTER_ACCEPT

        return NodeFilter.FILTER_SKIP
    }
}
export function init(layer, isFirstLayer) {
    if (isFirstLayer) {
        trackDirection();
        document.documentElement.addEventListener('focusin', handleFocusChange);
    }
    layer.initialActiveElement = document.activeElement;
    layer.iframe.focus();
    u.initPreviousSiblings(layer.iframe, function(e) {
        e._SimpleModalSkipFocus = true;
    });
}
export function release(layer, isLastLayer) {
    if (isLastLayer) {
        document.documentElement.removeEventListener('focusin', handleFocusChange);
    }
    layer.initialActiveElement && layer.initialActiveElement.focus();
    u.releasePreviousSiblings(layer.iframe, function(e) {
        delete e._SimpleModalSkipFocus;
    });
}