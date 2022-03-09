var SimpleModal = (function (exports) {
    'use strict';

    /*
        Read "configuration" from data-simple-modal-config attribute on html element
        Intended mainly for features on child pages, but we might add optional parent page features here, too.
    */
    var opts = (document.documentElement.getAttribute('simple-modal-config') || '').split(' ');
    var config = {
      autofocus: opts.indexOf('autofocus') != -1,
      animate: opts.indexOf('animate') != -1
    };

    function _typeof(obj) {
      "@babel/helpers - typeof";

      if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
        _typeof = function (obj) {
          return typeof obj;
        };
      } else {
        _typeof = function (obj) {
          return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
        };
      }

      return _typeof(obj);
    }

    function isObject(anything) {
      return anything !== null && _typeof(anything) == 'object';
    }
    function getMessage(anything) {
      return isObject(anything) && anything.message;
    }
    function postMessage(target, message) {
      target.postMessage({
        message: message
      }, '*');
    }
    function initPreviousSiblings(iframe, initFunction) {
      var cursor = iframe;

      while (cursor = cursor.previousElementSibling) {
        initFunction(cursor);
      }
    }
    function releasePreviousSiblings(iframe, releaseFunction) {
      var cursor = iframe; // If there are any other SimpleModal layers on top of this one, we're not ready to release previous siblings

      while (cursor = cursor.nextElementSibling) {
        if (cursor._isSimpleModalIframe) return;
      }

      cursor = iframe;

      while (cursor = cursor.previousElementSibling) {
        releaseFunction(cursor); // We've reached a previous modal layer. Release it, but no more previous elements.

        if (cursor._isSimpleModalIframe) return;
      }
    }
    function afterAnimation(element, then) {
      setTimeout(then, parseFloat(getComputedStyle(element).animationDuration) * 1000);
    }
    function resolve(url) {
      var a = document.createElement('a');
      a.href = url;
      return a.href;
    }

    var ae = document.activeElement; // Listen to messages from parent

    if (window.parent != window) {
      addEventListener('message', function (event) {
        if (event.source != window.parent) return;
        var data = event.data;

        if (getMessage(data) == 'CANCEL_SIMPLE_MODAL_ANIMATIONS') {
          if (config.animate) {
            cancel_animations();
          }

          postMessage(window.parent, 'SIMPLE_MODAL_ANIMATIONS_CANCELED');
        }

        if (getMessage(data) == 'SIMPLE_MODAL_LOADED_AND_REFOCUSED') {
          // If we're animating this window, don't autofocus until animation done
          if (config.autofocus && !config.animate) autofocus();
        }
      });
      trackAndRestoreFocus();
    }

    function trackAndRestoreFocus() {
      // track active element within this iframe
      document.documentElement.addEventListener('focus', function () {
        ae = document.activeElement;
      }, true); // when iframe regains focus, re-focus the correct element

      addEventListener('focus', function () {
        ae && ae.focus();
      });
    }

    function custom_event(name, params) {
      // Modern browsers
      if (typeof window.CustomEvent === "function") return new CustomEvent(name, params); // IE 9+ support

      params = params || {
        bubbles: false,
        cancelable: false,
        detail: undefined
      };
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent(name, params.bubbles, params.cancelable, params.detail);
      return event;
    }

    function fire_load() {
      window.dispatchEvent(custom_event('simplemodal-load'));
    }

    function autofocus() {
      var target = document.querySelector('[simple-modal-autofocus]');

      if (target) {
        target.focus();
        ae = target;
      }
    }

    function after_html_animation(callback) {
      var h = document.documentElement;
      var animation_seconds = parseFloat(getComputedStyle(h).animationDuration);
      setTimeout(callback, animation_seconds * 1000);
    }
    /*
        Wait for load event for multiple reasons:
        - ensure layout is finished before we start animation
        -  getComputedStyle in after_html_animation may block (waiting on stylesheets), blocking all "before-load" scripts
        - support autofocusing of dynamically added elements (as long as they are present before we run)
    */


    var animations_canceled = false;

    function cancel_animations() {
      if (animations_canceled) return;
      animations_canceled = true;
      var h = document.documentElement;
      h.classList.remove('SimpleModal-opening');
      h.classList.remove('SimpleModal-animating');
      config.autofocus && autofocus();
    }

    addEventListener('load', function () {
      if (config.animate) {
        if (document.querySelector('[autofocus]')) {
          /*
              Note - Safari seems to focus [autofocus] elements, even though this is an iframe. That broke our entrance animation on another site, but we haven't yet been able to replicate it. Seems to depend on page structure.
          */
          console.warn('autofocus not recommended when using SimpleModal animations. Can sometimes break animations in Safari, but only in certain situations.');
        }

        var h = document.documentElement;
        h.classList.add('SimpleModal-opening');
        h.classList.add('SimpleModal-animating');
        after_html_animation(function () {
          cancel_animations();
          fire_load();
        });
      } else {
        config.autofocus && autofocus();
        fire_load();
      }
    });
    function animateOut(then) {
      var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref$leaveBackdrop = _ref.leaveBackdrop,
          leaveBackdrop = _ref$leaveBackdrop === void 0 ? false : _ref$leaveBackdrop;

      if (!leaveBackdrop) postMessage(parent, 'ANIMATE_SIMPLE_MODAL_BACKDROP_OUT');
      var h = document.documentElement;
      h.classList.add('SimpleModal-closing');
      h.classList.add('SimpleModal-animating');
      if (then) after_html_animation(then);
    }

    function assertIframed() {
      if (window.parent == window) throw new Error('This is not a SimpleModal child window (it\'s not even in iframe)');
    }

    function isSameOrigin() {
      try {
        return Boolean(window.parent.location.hostname);
      } catch (e) {
        return false;
      }
    }

    function requiredLayerInParent() {
      var layer = window.parent.SimpleModal && window.parent.SimpleModal.layerForWindow(window);
      if (!layer) throw new Error("This is not a SimpleModal child window");
      return layer;
    }

    function _close() {
      var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var then = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      assertIframed();

      if (isSameOrigin()) {
        var layer = requiredLayerInParent();
        window.parent.SimpleModal.resolveLayer(layer, value);
        then && then();
        return;
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
        message: 'CLOSE_SIMPLE_MODAL_CHILD'
      }, '*');
    }

    function close() {
      var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var then = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      function do_close() {
        _close(value, then);
      }

      if (config.animate) {
        animateOut(do_close);
      } else {
        do_close();
      }
    }
    function replace(url) {
      var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref2$animated = _ref2.animated,
          animated = _ref2$animated === void 0 ? false : _ref2$animated;

      // Be sure to resolve urls relative to the child location, not the parent
      url = resolve(url);

      function do_replace() {
        parent.postMessage({
          message: 'REPLACE_SIMPLE_MODAL',
          url: url,
          animated: animated
        }, '*');
      }

      if (animated) {
        animateOut(do_replace, {
          leaveBackdrop: true
        });
      } else {
        do_replace();
      }
    }
    function reload() {
      replace(location.href);
    }

    function hide_element(element) {
      if (element._SimpleModalAriaInitialized) return;
      element._SimpleModalAriaInitialized = true;
      element._SimpleModalInitialAriaHidden = element.getAttribute('aria-hidden');
      element.setAttribute('aria-hidden', 'true');
    }

    function release_element(element) {
      if (!element._SimpleModalAriaInitialized) return;
      var hidden = element._SimpleModalInitialAriaHidden;

      if (hidden === null) {
        element.removeAttribute('aria-hidden');
      } else {
        element.setAttribute('aria-hidden', hidden);
      }

      delete element._SimpleModalAriaInitialized;
      delete element._SimpleModalInitialAriaHidden;
    }

    function init(layer) {
      var iframe = layer.iframe;
      iframe.setAttribute('role', 'dialog'); // Set aria-hidden on each previous sibling of iframe, storing initial values

      initPreviousSiblings(layer.iframe, hide_element);
    }
    function release(layer) {
      // restore initial aria-hidden values (unless still locked by another layer)
      releasePreviousSiblings(layer.iframe, release_element);
    }

    // Responsible for putting in DOM, and positioning on screen
    function cover(iframe, container) {
      var rect = container.getBoundingClientRect();
      var s = iframe.style;
      var h = document.documentElement;
      var left = Math.max(0, rect.left);
      s.left = left + 'px';
      s.width = Math.min(rect.right - left, h.clientWidth - left) + 'px';
      var top = Math.max(0, rect.top);
      s.top = top + 'px';
      s.height = Math.min(rect.bottom - top, h.clientHeight - top) + 'px';
    }

    function init$1(element, container) {
      (container || document.body).appendChild(element);
      var s = element.style;
      s.position = 'fixed';
      s.border = 'none';
      s.padding = 0; // This is the maximum supported z-index in current browsers (max 32 bit signed int), but the CSS spec doesn't actually specify this
      // We need to set this value for IE, which doesn't work when you set z-index to any higher number

      s.zIndex = 2147483647; // This is MAX_SAFE_INTEGER in JS
      // This is larger than the maximum supported z-index in any current browser
      // In IE, this has no effect.
      // In other browsers, this always seems to set z-index to the highest supported value, and should protect against future increases in that value.

      s.zIndex = 9007199254740991;

      if (container) {
        var position = cover.bind(null, element, container);
        element._simple_modal_position = position;
        position();
        addEventListener('scroll', position, true);
        addEventListener('resize', position);
      } else {
        s.left = s.top = '0px';
        s.width = s.height = '100%';
      }
    } // layer manager can tell us to update explicitly

    function update(element, container) {
      if (container) {
        element._simple_modal_position();
      }
    }
    function release$1(element, container) {
      element.parentElement && element.parentElement.removeChild(element);

      if (container) {
        var position = element._simple_modal_position;
        removeEventListener('scroll', position, true);
        removeEventListener('resize', position);
      }
    }

    /*
        This may be overly complicated.
        In most situations, we just want to replicate the behaviour of 
            overscroll-behaviour: contain
        but browser support isn't great yet, and I don't know if it even works on iframes.

        In certain situtations, that isn't even the behaviour we want.
        Imagine:
        HEADER
        --------------------------
                |  
        SIDEBAR | MAIN
                |  
                |  
                |  

        And the modal is set to cover MAIN.
        Here, if the entire page scrolls (ie. because sidebar is long), we want to let the page scroll.
        If MAIN scrolls, however, we _do_ want to lock it.
    */
    function ScrollLock(element) {
      var style = element.style;
      var count = 0;
      var scrollTop, scrollLeft, overflowX, overflowY, maxWidth;

      function fixScroll() {
        element.scrollTop = scrollTop;
        element.scrollLeft = scrollLeft;
      }

      function increment() {
        count++;
        if (count == 1) lock();
      }

      function decrement() {
        count--;
        if (count == 0) unlock();
      }

      function lock() {
        scrollTop = element.scrollTop;
        scrollLeft = element.scrollLeft; // Save values so we can restore

        overflowX = style.overflowX;
        overflowY = style.overflowY;
        maxWidth = style.maxWidth;
        /*
            Lock element dimensions.
            In some browsers/configurations, toggling overflow will cause scrollbars to hide.
            Lock dimensions so that the document doesn't reflow.
        */

        style.maxWidth = element.clientWidth + 'px'; // Lock scrolling
        // ONLY lock if element actually "has a scrollbar"
        // Otherwise, we can change how margin collapsing works, if the element currently has no overflow

        if (element.scrollWidth > element.clientWidth) style.overflowX = 'hidden';
        if (element.scrollHeight > element.clientHeight) style.overflowY = 'hidden';
        /*
            Note - even though we've set overflow hidden, that doesn't stop programmatic scrolling.
            If the modal's initial content is positioned offscreen (ie. if it is going to animate into view), then some browsers (safari) may try to scroll the container to put the child window in view.
            So we still need a scroll listener  to reset such browser-induced scrolling.
        */

        element.addEventListener('scroll', fixScroll);
      }

      function unlock() {
        style.maxWidth = maxWidth;
        style.overflowX = overflowX;
        style.overflowY = overflowY;
        element.removeEventListener('scroll', fixScroll);
      }

      return {
        increment: increment,
        decrement: decrement
      };
    }

    function increment_lock(element) {
      element._SimpleModalScrollLock = element._SimpleModalScrollLock || ScrollLock(element);

      element._SimpleModalScrollLock.increment();
    }

    function decrement_lock(element) {
      element._SimpleModalScrollLock.decrement();
    }

    function elements_to_lock(layer) {
      /*
          In the "normal" situation, we're appending iframe to body, but "covering" the entire <html> element. 
           Depending on style/layout, scrollbar could be on <html>, <body>, or both.
          So we need to lock both.
      */
      if (layer.container) return [layer.container];
      return [document.documentElement, document.body];
    }

    function init$2(layer) {
      elements_to_lock(layer).forEach(increment_lock);
    }
    function release$2(layer) {
      elements_to_lock(layer).forEach(decrement_lock);
    }

    /*
    Responsible for:
    - preventing focus of "covered" elements
    - focusing layers when opened/reloaded
    - restoring focus when layers are closed
    */
    /*
        Prevent programmatic/browser-automatic focusing of covered elements.
        
        We shouldn't have to do this, but we found a case (hard to reproduce), where Safari was focusing a username input on the parent page when it had a modal open. This feature is mainly to protect against that.
    */

    addEventListener('focus', function (event) {
      if (event.target.hasOwnProperty('_SimpleModalInitialTabIndex')) {
        event.target.blur();
      }
    }, true); // Fairly inclusive list of (potentially) focusable elements.
    // I used this for guidance: https://allyjs.io/data-tables/focusable.html

    var POTENTIALLY_FOCUSABLE = 'a,button,input,textarea,select,summary,[contenteditable],area,audio,video,object,embed,svg,iframe';

    function getPotentiallyFocusableChildren(layer) {
      return (layer.container || document.body).querySelectorAll(POTENTIALLY_FOCUSABLE);
    }

    function block(e) {
      // Do nothing if already blocked
      if (e.hasOwnProperty('_SimpleModalInitialTabIndex')) return;
      e._SimpleModalInitialTabIndex = e.getAttribute('tabindex');
      e.setAttribute('tabindex', -1);
    }

    function unblock(e) {
      var v = e._SimpleModalInitialTabIndex; // This element wasn't blocked by us. Leave tabindex alone.

      if (typeof v == 'undefined') return;
      if (v == null) e.removeAttribute('tabindex');else e.setAttribute('tabindex', v);
      delete e._SimpleModalInitialTabIndex;
    }

    function init$3(layer, isFirstLayer) {
      /*
          TODO - users might not be happy to have us messing with tabindex (even if only temporarily).
          We should offer an option to opt-out
      */
      var focusable = getPotentiallyFocusableChildren(layer);

      for (var i = focusable.length - 1; i >= 0; i--) {
        if (focusable[i] != layer.iframe) block(focusable[i]);
      }

      if (layer.replaces) {
        layer.initialActiveElement = layer.replaces.initialActiveElement; // This one shouldn't change focus when it's released

        layer.replaces.initialActiveElement = null;
      } else {
        layer.initialActiveElement = document.activeElement;
      }

      layer.iframe.focus();
    }

    function is_covered(e, excluding) {
      var cursor = e;

      while (cursor = cursor.nextElementSibling) {
        if (cursor._isSimpleModalIframe && cursor != excluding) return true;
      }

      if (e.parentElement) return is_covered(e.parentElement, excluding);
      return false;
    } // TODO - more efficient algorithm? Could work top-down/backwards
    // Getting it right in all scenarios (including concurrent modals, in different containers) isn't straight-forward
    // This is a bit of a brute-force approach, but it should be correct


    function release$3(layer) {
      var focusable = document.querySelectorAll(POTENTIALLY_FOCUSABLE);

      for (var i = focusable.length - 1; i >= 0; i--) {
        var e = focusable[i]; // Note - our iframe might not have been removed yet. Be sure we don't count it in the is_covered check

        if (!is_covered(e, layer.iframe)) unblock(e);
      }

      var ae = layer.initialActiveElement;
      if (ae && ae.tabIndex >= 0) ae.focus();
    }

    var layers = [];

    function makeIframe(sandbox) {
      var iframe = document.createElement('iframe'); // Not used by us anywhere, but can be useful for external code to identify our iframes

      iframe.classList.add('SimpleModalIframe');
      iframe._isSimpleModalIframe = true;
      var s = iframe.style; // Don't make the iframe visible until it has loaded
      // This makes it easier to animate in
      // Use opacity, rather than visibility, because browser don't let you focus hidden elements
      // May be more performant to toggle opacity, too
      // s.visibility = 'hidden';

      s.opacity = 0;

      if (sandbox !== null) {
        iframe.setAttribute('sandbox', sandbox);
      }

      return iframe;
    }

    function reveal(iframe) {
      iframe.style.opacity = '';
    }

    function is_same_origin(iframe) {
      try {
        return Boolean(iframe.contentDocument);
      } catch (e) {
        return false;
      }
    }

    function should_set_opaque_background(iframe) {
      // If the iframe is x-origin, we cannot  test the html element.
      // Have to assume the users have set it properly.
      if (!is_same_origin(iframe)) return false;
      var s = getComputedStyle(iframe.contentDocument.documentElement);
      var bc = s.backgroundColor;
      return (bc == 'transparent' || bc == 'rgba(0, 0, 0, 0)') && s.backgroundImage == 'none';
    }

    function layerLoaded(layer) {
      var iframe = layer.iframe; // Server-generated error pages won't have any background color.
      // It's really confusing when these load as a modal layer.
      // To help with that, if the background of the <html> element is totally transparent, we'll set a background color on the iframe

      iframe.style.backgroundColor = should_set_opaque_background(iframe) ? 'white' : '';

      if (layer.replaces) {
        postMessage(iframe.contentWindow, 'CANCEL_SIMPLE_MODAL_ANIMATIONS'); // Don't reveal until it tells us it has canceled animations
      } else {
        // Only needed on first load, but no harm running every load
        reveal(iframe);
      } // Seems to be needed in IE - iframe blurs when it reloads
      // We want to be sure to focus it now, before we call the onload callback (rather than waiting for our focus listener)


      if (iframe != document.activeElement && iframe.tabindex != -1) {
        iframe.focus();
      }

      postMessage(iframe.contentWindow, 'SIMPLE_MODAL_LOADED_AND_REFOCUSED');
      layer.onload && layer.onload(layer.iframe.contentWindow);
    }

    function layerForWindow(w) {
      for (var i = 0; i < layers.length; i++) {
        if (layers[i].iframe.contentWindow == w) return layers[i];
      }
    }
    function top() {
      // Notice - will be undefined if no layers open
      return layers[layers.length - 1];
    }

    function addBackdrop(layer) {
      var backdrop = document.createElement('div');
      backdrop.classList.add('SimpleModalBackdrop');
      backdrop.classList.add('animating');
      init$1(backdrop, layer.container);
      afterAnimation(backdrop, function () {
        backdrop.classList.remove('animating');
      });
      layer.backdrop = backdrop;
    }

    function open(layer, src) {
      // If this layer is replacing another, it will already have a backdrop
      if (!layer.backdrop) addBackdrop(layer);
      var iframe = makeIframe(layer.sandbox);
      layer.iframe = iframe;
      layers.push(layer);
      init$2(layer);
      init$1(layer.iframe, layer.container);
      init$3(layer);
      init(layer);
      iframe.addEventListener('load', layerLoaded.bind(null, layer));
      iframe.src = src;
    }
    function resolve$1(layer, value) {
      // Remove it from list
      var index = layers.indexOf(layer);
      if (index == -1) throw new Error('Layer is not in layers.');
      layers.splice(index, 1); // If the layer still has a backdrop, remove it

      var backdrop = layer.backdrop;
      if (backdrop) removeBackdrop(backdrop, layer.container);
      release(layer);
      release$3(layer);
      release$1(layer.iframe, layer.container);
      release$2(layer);
      layer.onclose && layer.onclose(value);
      layer.promiseResolver && layer.promiseResolver(value);
    }
    function replace$1(layer, url) {
      var animated = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var next = {
        sandbox: layer.sandbox,
        onload: layer.onload,
        onclose: layer.onclose,
        promiseResolver: layer.promiseResolver,
        container: layer.container,
        backdrop: layer.backdrop
      }; // Ensure nothing happens when remove current, or if it loads again

      layer.onload = null;
      layer.onclose = null;
      layer.promiseResolver = null;
      layer.backdrop = null;

      if (animated) {
        // Close current layer, opening the next one after exit animation runs
        layer.onclose = open.bind(null, next, url);
        resolve$1(layer);
      } else {
        // Open the next layer, and have it replace the current one without animation once loaded
        next.replaces = layer;
        open(next, url);
      }
    }
    function updatePositions() {
      for (var i = 0; i < layers.length; i++) {
        update(layers[i].iframe, layers[i].container);
      }
    }

    function animateBackdropOut(layer) {
      var backdrop = layer.backdrop;
      if (!backdrop) return; // tell resolve not remove the backdrop - let the exit animation finish

      layer.backdrop = null;
      backdrop.classList.add('animating');
      backdrop.classList.add('closing');
      afterAnimation(backdrop, removeBackdrop.bind(null, backdrop, layer.container));
    }

    function removeBackdrop(backdrop, container) {
      release$1(backdrop, container);
    }

    addEventListener('message', function (event) {
      var layer = layerForWindow(event.source);
      if (!layer) return;
      var data = event.data; // x-origin child explicitly asked to be closed

      if (getMessage(data) == 'CLOSE_SIMPLE_MODAL_CHILD') {
        resolve$1(layer, event.data.value);
      }

      if (getMessage(data) == 'REPLACE_SIMPLE_MODAL') {
        replace$1(layer, data.url, data.animated);
      }

      if (getMessage(data) == 'SIMPLE_MODAL_ANIMATIONS_CANCELED') {
        reveal(layer.iframe);
        resolve$1(layer.replaces);
        layer.replaces = null;
      }

      if (getMessage(data) == 'ANIMATE_SIMPLE_MODAL_BACKDROP_OUT') {
        animateBackdropOut(layer);
      }
    });

    // child.js adds global event listeners

    function open$1(url) {
      var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref$onload = _ref.onload,
          onload = _ref$onload === void 0 ? null : _ref$onload,
          _ref$onclose = _ref.onclose,
          onclose = _ref$onclose === void 0 ? null : _ref$onclose,
          _ref$sandbox = _ref.sandbox,
          sandbox = _ref$sandbox === void 0 ? null : _ref$sandbox,
          _ref$container = _ref.container,
          container = _ref$container === void 0 ? null : _ref$container;

      var layer = {
        sandbox: sandbox,
        onload: onload,
        onclose: onclose,
        promiseResolver: null,
        container: container
      };
      open(layer, url); // Return a promise, but only if Promise() is implemented in browser

      try {
        return new Promise(function (resolve, reject) {
          layer.promiseResolver = resolve;
        });
      } catch (e) {}
    }
    function closeChild(value) {
      var layer = top();
      if (!layer) throw new Error('No modal window is open');
      resolve$1(layer, value);
    } // public child window API

    exports.animateOut = animateOut;
    exports.close = close;
    exports.closeChild = closeChild;
    exports.layerForWindow = layerForWindow;
    exports.open = open$1;
    exports.reload = reload;
    exports.replace = replace;
    exports.replaceLayer = replace$1;
    exports.resolveLayer = resolve$1;
    exports.updatePositions = updatePositions;

    return exports;

}({}));
//# sourceMappingURL=SimpleModal.js.map
