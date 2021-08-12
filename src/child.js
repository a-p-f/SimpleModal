// Listen to messages from parent
addEventListener('message', function(event) {
    if (window.parent == window || event.source != window.parent) return

    if (event.data == 'SIMPLE_MODAL_CHILD_LOADED') {
        window.parent.postMessage({
            simple_modal_child_titled: document.title, 
        }, '*');
    }
});
function get_same_origin_parent_simple_modal() {
    // Throws an exception if parent is x-origin
    // Returns null if no parent or not a modal child (ie. regular iframe)
    const pml = window.parent != window && window.parent.SimpleModal;
    if (!pml || pml.getChild() != window) return null;
    return pml;
}
export function close(value=null, then=null) {
    let parent_simple_modal;
    let x_origin = false;
    try {
        parent_simple_modal = get_same_origin_parent_simple_modal();
    }
    catch (e) {
        x_origin = true;
    }

    if (parent_simple_modal) {
        // Note - call parent's closeChild() directly, rather than using postMessage
        // This allows same-origin windows to pass non-serializable values
        parent_simple_modal.closeChild(value, then);
        return
    }
    if (!x_origin) {
        throw new Error('This window is not a SimpleModal child.');
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