
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var SimpleModal = (function (exports) {
	'use strict';

	var maxWidth, overflowX, overflowY;
	var scrollTop, scrollLeft, isLocked;
	function lockScroll() {
	  var de = document.documentElement;
	  var ds = de.style;
	  var bs = document.body.style; // Save style values so we can restore

	  overflowX = bs.overflowX;
	  overflowY = bs.overflowY;
	  maxWidth = ds.maxWidth;
	  scrollTop = de.scrollTop;
	  scrollLeft = de.scrollLeft;
	  isLocked = true;
	  /*
	  	Lock document dimensions.
	  	In some browsers/configurations, toggling overflow will cause scrollbars to hide.
	  	Lock dimensions so that the document doesn't reflow.
	  */

	  ds.maxWidth = de.clientWidth + 'px'; // Now lock scrolling

	  bs.overflowX = 'hidden';
	  bs.overflowY = 'hidden';
	}
	function releaseScroll() {
	  var ds = document.documentElement.style;
	  var bs = document.body.style;
	  isLocked = false;
	  bs.overflowY = overflowY;
	  bs.overflowX = overflowX;
	  ds.maxWidth = maxWidth;
	}
	/*
		Note - even though we've set overflow hidden on documentElement, that doesn't stop programmatic scrolling.
		If the modal's initial content is positioned offscreen (ie. if it is going to animate into view), then some browsers (safari) may try to scroll the parent window's document to put the child window in view.
		So we still need a scroll listener  to reset such browser-induced scrolling.
	*/

	addEventListener('scroll', function () {
	  if (!isLocked) return;
	  document.documentElement.scrollTop = scrollTop;
	  document.documentElement.scrollLeft = scrollLeft;
	});

	var previousActiveElement;
	var iframe = null;
	function create_iframe() {
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
	  var s = iframe.style; // TODO - fallback for browsers not supporting position: fixed (Opera Mini) ?

	  s.position = 'fixed';
	  s.top = 0;
	  s.left = 0;
	  s.width = '100%';
	  s.height = '100%';
	  s.border = 'none';
	  s.margin = 0;
	  s.padding = 0; // Don't make the iframe visible until it has loaded
	  // This makes it easier to animate in

	  s.visibility = 'hidden'; // This is the maximum supported z-index in current browsers (max 32 bit signed int), but the CSS spec doesn't actually specify this
	  // We need to set this value for IE, which doesn't work when you set z-index to any higher number

	  s.zIndex = 2147483647; // This is MAX_SAFE_INTEGER in JS
	  // This is larger than the maximum supported z-index in any current browser
	  // In IE, this has no effect.
	  // In other browsers, this always seems to set z-index to the highest supported value, and should protect against future increases in that value.

	  s.zIndex = 9007199254740991;
	  iframe.setAttribute('role', 'dialog'); // TODO - test with screen reader in Safari, ensure content is accessible
	  // See https://bugs.webkit.org/show_bug.cgi?id=174667
	  // and https://developer.paciellogroup.com/blog/2018/06/the-current-state-of-modal-dialog-accessibility/
	  // which suggest there is a serious issue in safari

	  iframe.setAttribute('aria-modal', 'true');
	  document.body.appendChild(iframe);
	  iframe.focus();
	  return iframe;
	}
	function remove_iframe() {
	  if (!iframe) return;
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
	} // TODO - play nice with other "dynamic overlays" - if focus moved to an element after iframe in DOM, then do nothing


	function refocus_iframe() {
	  if (document.activeElement != iframe) iframe.focus();
	}

	function getActiveElement() {
	  var c = document.activeElement; // If the activeElement is an iframe, try to descend into the iframe
	  // If we reach a cross-origin iframe, error will be thrown

	  try {
	    while (c && c.contentDocument && c.contentDocument.activeElement) {
	      c = c.contentDocument.activeElement;
	    }
	  } catch (e) {}

	  return c;
	}

	var DIRTY_NAME_PREFIX = 'SimpleModal-dirty-initial-history-position-';
	var on_popstate = null;

	function safe_get_state() {
	  try {
	    return history.state;
	  } catch (e) {
	    return null;
	  }
	}

	function get_initial_data_from_name() {
	  var matches = window.name.match(/^SimpleModal-dirty-initial-history-position-(\d+):(.*)/);
	  return matches && {
	    position: parseInt(matches[1]),
	    name: matches[2]
	  };
	}

	function is_dirty() {
	  return Boolean(get_initial_data_from_name());
	}

	function return_to_initial_state_if_dirty() {
	  if (is_dirty()) {
	    return_to_initial_state(function () {});
	  }
	}

	addEventListener('popstate', function () {
	  if (on_popstate) {
	    on_popstate();
	    on_popstate = null;
	  }
	}); // TODO - add tests to exercise these

	addEventListener('load', return_to_initial_state_if_dirty); // We shouldn't need to do this on BF cache - in that case, the modal SHOULD be open, and working properly
	// addEventListener('pageshow', return_to_initial_state_if_dirty);

	function mark_initial_state() {
	  // Eventually, we're going to return to this state via history.go()
	  // We need that transition to trigger a popstate event
	  // history.replaceState(safe_get_state(), '', location.href);
	  // Push another state, so that we know history.length is meaningful, and so we force a popstate event when returning to initial state
	  history.pushState(safe_get_state(), '', location.href); // }
	  // export function record_previous_history_position() {

	  /*
	      Record previous history position on window.name
	       Should be called "one state after" you've called "mark_initial_state"
	       Need to record it somewhere such that the modal iframe can navigate around
	      (creating new history entries/states), and it will still be accessible if end-user reloads the page (or navigates away, and then comes back).
	       We don't want to mess with the url (in case end-user copies address while page is open),
	      so we can't store it there.
	       Note - we record history.length-1, because we want to return to the state BEFORE this one.
	  */

	  window.name = DIRTY_NAME_PREFIX + (history.length - 1) + ':' + window.name;
	}
	function return_to_initial_state(then) {
	  if (!is_dirty()) {
	    throw new Error('Window is not dirty!');
	  }

	  var initial_data = get_initial_data_from_name();
	  window.name = initial_data.name; // Push an extra state, so that history.length is meaningful

	  history.pushState(safe_get_state(), '', location.href); // Call the callback AFTER we've returned to correct history state

	  var to_go_back = history.length - initial_data.position;

	  if (to_go_back) {
	    on_popstate = then;
	    history.go(-1 * to_go_back);
	  } else {
	    then();
	  }
	}

	var opening_page_url = null;
	function get_opening_page_url() {
	  if (!opening_page_url) {
	    throw new Error('You have not configured the "opening page url". Please refer to README.');
	  }

	  return opening_page_url;
	}
	function set_opening_page_url(url) {
	  // Use a link to resolve the url relative to current page
	  // We need an absolute url, so we can compare against iframe src later
	  var link = document.createElement('a');
	  link.href = url;
	  opening_page_url = link.href;
	}
	/*
	    Provide a means to specify opening page url in html.
	    User can set this attribute on any element which is present when script runs.
	    Recommend putting it directly on SimpleModal.js script.
	*/

	var attr = 'modal-layer-opening-page-url';
	var e = document.querySelector('[' + attr + ']');

	if (e) {
	  set_opening_page_url(e.getAttribute(attr));
	}

	var iframe$1;
	var onclose_callback;
	var onclose_resolve;

	function is_same_origin(iframe) {
	  return Boolean(iframe.contentDocument);
	}

	function should_set_opaque_background(iframe) {
	  // If the iframe is x-origin, we cannot test the html element.
	  // Have to assume the users have set it properly.
	  if (!is_same_origin(iframe)) return false;
	  var color = getComputedStyle(iframe.contentDocument.documentElement).backgroundColor;
	  return color == 'transparent' || color == 'rgba(0, 0, 0, 0)';
	}
	/*
		Listen to messages from child window
	*/


	addEventListener('message', function (event) {
	  if (!iframe$1 || event.source != iframe$1.contentWindow) return; // User hit back button to return to opening page

	  if (event.data == 'MODAL_LAYER_OPENING_PAGE_RETURNED') {
	    closeChild();
	    return;
	  } // x-origin child explicitly asked to be closed


	  if (event.data && event.data.message == 'CLOSE_MODAL_LAYER_CHILD') {
	    closeChild(event.data.value);
	  } // x-origin child told us it's title


	  if (event.data && 'modal_layer_child_titled' in event.data) {
	    iframe$1.setAttribute('aria-label', event.data.modal_layer_child_titled);
	  }
	}); // Listen to messages from parent

	addEventListener('message', function (event) {
	  if (window.parent == window || event.source != window.parent) return;

	  if (event.data == 'MODAL_LAYER_CHILD_LOADED') {
	    var autofocus = document.querySelector('[autofocus]');
	    autofocus && autofocus.focus();
	    window.parent.postMessage({
	      modal_layer_child_titled: document.title
	    }, '*');
	  }
	});

	function make_absolute(url) {
	  var a = document.createElement('a');
	  a.href = url;
	  return a.href;
	}

	function open(url) {
	  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
	      _ref$onload = _ref.onload,
	      onload = _ref$onload === void 0 ? function (w) {} : _ref$onload,
	      _ref$onclose = _ref.onclose,
	      onclose = _ref$onclose === void 0 ? function (value) {} : _ref$onclose,
	      _ref$sandbox = _ref.sandbox,
	      sandbox = _ref$sandbox === void 0 ? null : _ref$sandbox;

	  if (iframe$1) {
	    throw new Error('A SimpleModal is already open. A window may only open one SimpleModal at a time. We may relax this in the future, but for now, that\'s the deal.');
	  } // Will throw an error is user hasn't configured it yet.
	  // Want to verify it's set before we proceed.


	  var opening_page_url = get_opening_page_url();
	  mark_initial_state();
	  iframe$1 = create_iframe();
	  onclose_callback = onclose;

	  if (sandbox !== null) {
	    iframe$1.setAttribute('sandbox', sandbox);
	  }

	  var opening_page_loaded = false;

	  iframe$1.onload = function () {
	    if (!opening_page_loaded) {
	      opening_page_loaded = true; // Tell the iframe to advance
	      // It will change its own location
	      // In some browsers, this has different behaviour than changing iframe src
	      // In Safari, changing iframe src will cause _this_ window to reload if the user hits the back button, which we can't have

	      iframe$1.contentWindow.postMessage(make_absolute(url));
	      return;
	    } // Server-generated error pages won't have any background color.
	    // It's really confusing when these load as a modal layer.
	    // To help with that, if the background of the <html> element is totally transparent, we'll set a background color on the iframe


	    iframe$1.style.backgroundColor = should_set_opaque_background(iframe$1) ? 'white' : '';

	    if (is_same_origin(iframe$1)) {
	      var autofocus = iframe$1.contentDocument.querySelector('[autofocus]');
	      autofocus && autofocus.focus();
	      iframe$1.setAttribute('aria-label', iframe$1.contentDocument.title);
	    } else {
	      // Tell the child to autofocus and to pass us its title
	      iframe$1.contentWindow.postMessage('MODAL_LAYER_CHILD_LOADED', '*');
	    }

	    onload(iframe$1.contentWindow);
	    iframe$1.style.visibility = '';
	  };

	  iframe$1.src = opening_page_url; // Return a promise, but only if Promise() is implemented in browser

	  try {
	    return new Promise(function (resolve, reject) {
	      onclose_resolve = resolve;
	    });
	  } catch (e) {}
	}
	var is_closing = false;
	function closeChild() {
	  var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
	  var then = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

	  if (is_closing) {
	    throw new Error('SimpleModal is already in the process of closing a modal child.');
	  }

	  is_closing = true;
	  remove_iframe();

	  function done() {
	    onclose_callback(value);
	    onclose_resolve && onclose_resolve(value);
	    is_closing = false;
	    iframe$1 = null;
	    onclose_callback = null;
	    onclose_resolve = null;
	    then && then(window);
	  }

	  return_to_initial_state(done);
	} // Note - needed by close() from child window, but we may or may not decide to document this function

	function getChild() {
	  return iframe$1 && iframe$1.contentWindow || null;
	}

	function get_same_origin_parent_modal_layer() {
	  // Throws an exception if parent is x-origin
	  // Returns null if no parent or not a modal child (ie. regular iframe)
	  var pml = window.parent != window && window.parent.SimpleModal;
	  if (!pml || pml.getChild() != window) return null;
	  return pml;
	}

	function close() {
	  var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
	  var then = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
	  var parent_modal_layer;
	  var x_origin = false;

	  try {
	    parent_modal_layer = get_same_origin_parent_modal_layer();
	  } catch (e) {
	    x_origin = true;
	  }

	  if (parent_modal_layer) {
	    // Note - call parent's closeChild() directly, rather than using postMessage
	    // This allows same-origin windows to pass non-serializable values
	    parent_modal_layer.closeChild(value, then);
	    return;
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
	    message: 'CLOSE_MODAL_LAYER_CHILD'
	  }, '*');
	}

	exports.close = close;
	exports.closeChild = closeChild;
	exports.getChild = getChild;
	exports.open = open;
	exports.set_opening_page_url = set_opening_page_url;

	return exports;

}({}));
//# sourceMappingURL=SimpleModal.js.map
