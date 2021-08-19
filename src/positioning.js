// Responsible for putting in DOM, and positioning on screen

function cover(iframe, container) {
    const rect = layer.covering;
    const s = iframe.style;
    const h = document.documentElement;

    const left = Math.max(0, rect.left);
    s.left = left+'px';
    s.width = Math.min(
        h.clientWidth-rect.left-rect.right, 
        h.clientWidth-left,
    )+'px';
    const top = Math.max(0, rect.top)
    s.top = top+'px';
    s.height = Math.min(
        h.clientHeight-rect.top-rect.bottom,
        h.clientHeight-top,
    )+'px';
}

export function init(layer) {
    (layer.covering||document.body).appendChild(layer.iframe);
    const s = layer.iframe.style;

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

    if (layer.covering) {
        layer._position = cover.bind(null, layer.iframe, layer.covering);
        layer._position();

        // TODO - add scroll, resize listeners
        // Listen for a custom event that users can fire
        addEventListener('scroll', layer._position, true);
        addEventListener('resize', layer._position);
        addEventListener('simple')
    }
    else {
        s.left = s.top = '0px';
        s.width = s.height = '100%';
    }
}

// layer manager can tell us to update explicitly
export function update(layer) {
    if (layer.covering) {
        layer._position();
    }
}

export function release(layer) {
    layer.iframe.parentElement && layer.iframe.parentElement.removeChild(layer.iframe);
    if (layer.covering) {
        removeEventListener('scroll', layer._position, true);
        removeEventListener('resize', layer._position);
    }
}