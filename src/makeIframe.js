export default function(sandbox) {
    const iframe = document.createElement('iframe');
    const s = iframe.style;
    // TODO - fallback for browsers not supporting position: fixed (Opera Mini) ?
    s.position = 'fixed';
    s.top = 0;s.left = 0;s.width = '100%';s.height = '100%';
    s.border = 'none';
    s.margin = 0; s.padding = 0;

    // Don't make the iframe visible until it has loaded
    // This makes it easier to animate in
    // Use opacity, rather than visibility, because browser don't let you focus hidden elements
    // May be more performant to toggle opacity, too
    // s.visibility = 'hidden';
    s.opacity = 0;

    // This is the maximum supported z-index in current browsers (max 32 bit signed int), but the CSS spec doesn't actually specify this
    // We need to set this value for IE, which doesn't work when you set z-index to any higher number
    s.zIndex = 2147483647;

    // This is MAX_SAFE_INTEGER in JS
    // This is larger than the maximum supported z-index in any current browser
    // In IE, this has no effect.
    // In other browsers, this always seems to set z-index to the highest supported value, and should protect against future increases in that value.
    s.zIndex = 9007199254740991;

    iframe.setAttribute('role', 'dialog');
    // TODO - test with screen reader in Safari, ensure content is accessible
    // See https://bugs.webkit.org/show_bug.cgi?id=174667
    // and https://developer.paciellogroup.com/blog/2018/06/the-current-state-of-modal-dialog-accessibility/
    // which suggest there is a serious issue in safari
    iframe.setAttribute('aria-modal', 'true');

    if (sandbox !== null) {
        iframe.setAttribute('sandbox', sandbox);
    }
    return iframe;
}
