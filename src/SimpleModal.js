import {iframe, create_iframe, remove_iframe} from './iframe.js';
// child.js adds global event listeners
import './child.js';

let onclose_callback;
let onclose_resolve;
let on_iframe_load_after_opening_page;

function is_same_origin(iframe) {
	return Boolean(iframe.contentDocument);
}
function should_set_opaque_background(iframe) {
	// If the iframe is x-origin, we cannot test the html element.
	// Have to assume the users have set it properly.
	if (!is_same_origin(iframe)) return false; 

	const color = getComputedStyle(iframe.contentDocument.documentElement).backgroundColor;
	return color == 'transparent' || color == 'rgba(0, 0, 0, 0)';
}

/*
	Listen to messages from child window
*/
addEventListener('message', function(event) {
	if (!iframe || event.source != iframe.contentWindow) return
	
	// x-origin child explicitly asked to be closed
	if (event.data && event.data.message == 'CLOSE_SIMPLE_MODAL_CHILD') {
		closeChild(event.data.value);
	}

	// x-origin child told us it's title
	if (event.data && 'simple_modal_child_titled' in event.data) {
		iframe.setAttribute('aria-label', event.data.simple_modal_child_titled);
	}
});

function make_absolute(url) {
	const a = document.createElement('a');
	a.href = url;
	return a.href;
}

export function open(url, {
	onload=w=>{},
	onclose=value=>{},

	// Currently only used for testing (fake x-origin)
	// TODO - should we document? Users might want sandbox x-origin frames
	sandbox=null,
}={}) {
	if (iframe) {
		throw new Error('A SimpleModal is already open. A window may only open one SimpleModal at a time. We may relax this in the future, but for now, that\'s the deal.');
	}
	create_iframe();
	onclose_callback = onclose;
	if (sandbox !== null) {
		iframe.setAttribute('sandbox', sandbox);
	}

	iframe.onload = function() {
		// Server-generated error pages won't have any background color.
		// It's really confusing when these load as a modal layer.
		// To help with that, if the background of the <html> element is totally transparent, we'll set a background color on the iframe
		iframe.style.backgroundColor = should_set_opaque_background(iframe) ? 'white' : '';

		if (is_same_origin(iframe)) {
			iframe.setAttribute('aria-label', iframe.contentDocument.title);
		}
		else {
			// Tell the child to pass us its title
			iframe.contentWindow.postMessage('SIMPLE_MODAL_CHILD_LOADED', '*');
		}

		onload(iframe.contentWindow);

		// Only needed on first load, but no harm running every load
		iframe.style.visibility = '';
		// Firefox doesn't let us focus the iframe before it's visible, so we do it here
		// Make sure it's not already activeElement, though
		// (if the child window programmatically focused one of it's elements, calling iframe.focus() will cause that element to lose focus)
		if (iframe != document.activeElement) {
			iframe.focus();
		}

	}
	iframe.src = url;

	// Return a promise, but only if Promise() is implemented in browser
	try {
		return new Promise((resolve, reject) => {
			onclose_resolve = resolve;
		});
	} catch (e) {}
}

export function closeChild(value=null, then=null) {
	remove_iframe();
	onclose_callback(value); 
	onclose_resolve && onclose_resolve(value);
	onclose_callback = null;
	onclose_resolve = null;
	then && then(window);
}

// Note - needed by close() from child window, but we may or may not decide to document this function
export function getChild() {
    return (iframe && iframe.contentWindow) || null;
}

export {
	close
} from './child.js';