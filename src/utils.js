export function isObject(anything) {
    return anything !== null && typeof anything == 'object'
}
export function getMessage(anything) {
    return isObject(anything) && anything.message;
}
export function postMessage(target, message) {
    target.postMessage({message: message}, '*');
}

export function initPreviousSiblings(iframe, initFunction) {
    let cursor = iframe;
    while (cursor = cursor.previousElementSibling) {
        initFunction(cursor);
    }
}
export function releasePreviousSiblings(iframe, releaseFunction) {
    let cursor = iframe;

    // If there are any other SimpleModal layers on top of this one, we're not ready to release previous siblings
    while (cursor = cursor.nextElementSibling) {
        if (cursor._isSimpleModalIframe) return
    }

    cursor = iframe;
    while (cursor = cursor.previousElementSibling) {
        releaseFunction(cursor);

        // We've reached a previous modal layer. Release it, but no more previous elements.
        if (cursor._isSimpleModalIframe) return
    }
}
export function afterAnimation(element, then) {
    setTimeout(
        then, 
        parseFloat(getComputedStyle(element).animationDuration)*1000,
    );
}