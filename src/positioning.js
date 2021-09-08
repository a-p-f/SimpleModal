// Responsible for putting in DOM, and positioning on screen
function cover(iframe, container) {
    const rect = container.getBoundingClientRect();
    const s = iframe.style;
    const h = document.documentElement;

    const left = Math.max(0, rect.left);
    s.left = left+'px';
    s.width = Math.min(
        rect.right-left,
        h.clientWidth-left,
    ) + 'px';
    const top = Math.max(0, rect.top);
    s.top = top+'px';
    s.height = Math.min(
        rect.bottom-top,
        h.clientHeight-top,
    ) + 'px';
}

export function init(element, container) {
    (container||document.body).appendChild(element);
    const s = element.style;

    s.position = 'fixed';
    s.border = 'none';
    s.padding = 0;

    // This is the maximum supported z-index in current browsers (max 32 bit signed int), but the CSS spec doesn't actually specify this
    // We need to set this value for IE, which doesn't work when you set z-index to any higher number
    s.zIndex = 2147483647;

    // This is MAX_SAFE_INTEGER in JS
    // This is larger than the maximum supported z-index in any current browser
    // In IE, this has no effect.
    // In other browsers, this always seems to set z-index to the highest supported value, and should protect against future increases in that value.
    s.zIndex = 9007199254740991;

    if (container) {
        const position = cover.bind(null, element, container);
        element._simple_modal_position = position;
        position();

        addEventListener('scroll', position, true);
        addEventListener('resize', position);
    }
    else {
        s.left = s.top = '0px';
        s.width = s.height = '100%';
    }
}

// layer manager can tell us to update explicitly
export function update(element, container) {
    if (container) {
        element._simple_modal_position();
    }
}

export function release(element, container) {
    element.parentElement && element.parentElement.removeChild(element);
    if (container) {
        const position = element._simple_modal_position;
        removeEventListener('scroll', position, true);
        removeEventListener('resize', position);
    }
}