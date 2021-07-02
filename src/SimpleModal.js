import {create_iframe, remove_iframe} from './iframe.js';

let iframe;
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
// Listen to messages from parent
addEventListener('message', function(event) {
	if (window.parent == window || event.source != window.parent) return

	if (event.data == 'SIMPLE_MODAL_CHILD_LOADED') {
		const autofocus = document.querySelector('[autofocus]');
		autofocus && autofocus.focus();
		window.parent.postMessage({
			simple_modal_child_titled: document.title, 
		}, '*');
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
	iframe = create_iframe();
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
			const autofocus = iframe.contentDocument.querySelector('[autofocus]');
			autofocus && autofocus.focus();
			iframe.setAttribute('aria-label', iframe.contentDocument.title);
		}
		else {
			// Tell the child to autofocus and to pass us its title
			iframe.contentWindow.postMessage('SIMPLE_MODAL_CHILD_LOADED', '*');
		}

		onload(iframe.contentWindow);

		iframe.style.visibility = '';
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
	iframe = null;
	onclose_callback = null;
	onclose_resolve = null;
	then && then(window);
}

// Note - needed by close() from child window, but we may or may not decide to document this function
export function getChild() {
	return (iframe && iframe.contentWindow) || null;
}

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