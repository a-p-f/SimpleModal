import {lockScroll, releaseScroll} from './lockScroll.js';

let previousActiveElement;
let iframe = null;

export function create_iframe() {
	/*
		TODO:
		Add mutation observer to detect when other scripts move/delete our iframe
		(log warning / throw exception when it does)
		This breaks the page, because SimpleModal thinks child is open (and we block interaction of parent page). We could try to recover, but throwing exception is probably enough. External scripts should NOT be messing with our iframe while it is open.
	*/

	if (iframe) {
		throw new Error('iframe already exists!');
	}

	lockScroll();

	previousActiveElement = getActiveElement();
	addEventListener('click', cancel, true);
	document.documentElement.addEventListener('focus', refocus_iframe, true);

	iframe = document.createElement('iframe');
	const s = iframe.style;
	// TODO - fallback for browsers not supporting position: fixed (Opera Mini) ?
	s.position = 'fixed';
	s.top = 0;s.left = 0;s.width = '100%';s.height = '100%';
	s.border = 'none';
	s.margin = 0; s.padding = 0;

	// Don't make the iframe visible until it has loaded
	// This makes it easier to animate in
	s.visibility = 'hidden';

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
	document.body.appendChild(iframe);
	iframe.focus();

	return iframe;
}
export function remove_iframe() {
	if (!iframe) return
	iframe.parentElement.removeChild(iframe);
	removeEventListener('click', cancel, true);
	document.documentElement.removeEventListener('focus', refocus_iframe, true);
	previousActiveElement && previousActiveElement.focus();
	previousActiveElement = null;
	iframe = null;
	releaseScroll();
}
function cancel(event) {
	event.stopPropagation();
	event.preventDefault();
}
// TODO - play nice with other "dynamic overlays" - if focus moved to an element after iframe in DOM, then do nothing
function refocus_iframe() {
	if (document.activeElement != iframe) iframe.focus();
}
function getActiveElement() {
	let c = document.activeElement;
	// If the activeElement is an iframe, try to descend into the iframe
	// If we reach a cross-origin iframe, error will be thrown
	try {
		while (c && c.contentDocument && c.contentDocument.activeElement) {
			c = c.contentDocument.activeElement;
		}
	} catch(e) {}
	return c;
}