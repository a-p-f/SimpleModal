# SimpleModal.js

Inspired by openModal.js, but somewhate simplified (doesn't create an extra history state when opening iframe).

Think of `SimpleModal.open(url)` as an alternative to `window.open(url)`. It opens the specified document in a "modal layer" over top of your existing page. Modal layers have the following features:

- **Modal:** The user cannot interact with the opening window until the modal layer is closed.
- **Cover Entire Viewport:** Modal layers cover the entire viewport, have a transparent background, and render no border/chrome of their own. It's up to the document inside the modal layer to decide to how to lay itself out (full-page, light box, alert style window, etc.).
- **Accessible:** Screen reader friendly, and focus is trapped inside the modal layer. TODO - more screen reader testing.
- **Cross-origin Capable:** Cross-origin layers are supported.

## Installation
- copy dist/SimpleModal.min.js to your server (or SimpleModal.js and SimpleModal.js.map)
- add SimpleModal.min.js to your parent page (and optionally, to your child pages)
- `SimpleModal` is now available globally

## Parent Window API

### SimpleModal.open(url, [options]) -> Promise | null
Opens url in a modal layer.

IFF the `Promise` constructor is defined, will return a promise which resolves when the modal is closed, with the same value as passed to `options.onclose` (see below). This feature doesn't let you do anything you can't already do with `options.onclose`, but can more convenient (especially if used with `async`/`await`). If you're using this feature and want to support IE, be sure to provide a `Promise` polyfill.

#### options.onload: function(Window)
A callback, which will be called each time a new page loads in the modal layer. It will be passed the modal window as its sole argument.

#### options.onclose: function(value)
A callback, which will be called when the modal window is closed. The argument will be whatever was passed to `SimpleModal.closeChild`, or `undefined`.

#### options.container: element
Normally, the iframe is appended to `document.body`, and disables all other elements on the page (scrolling, clicks, and keyboard access). 

If you specify `container`, the iframe will be appended to that element (and will always occupy the intersection of that element with the viewport). Scrolling, clicks, and keyboard access will only be blocked within that container. This allows you to, ie, leave a sidebar nav menu accessible while the "modal" is open.

### SimpleModal.closeChild([value], [then])
If a current modal layer exists, close it. Otherwise, throw an error.

`value`: will be passed to the `onclose` callback that was specified when the modal layer was opened.

BROKEN FEATURE (TODO - fix this):
`then`: if specified, this callback will be called after the modal has finished closing. It will be passed the parent window as its sole argument. The main purpose of this callback is so that the child window can close itself, and then cause the parent to take some action after it is fully closed (ie. open another modal, navigate to another page, etc).

Note - generally, the child will dismiss itself. Our recommended approach is not to call this method directly. Rather, we recommend including SimpleModal.js in the child window, and calling `SimpleModal.close()` from the child window.

## Child Window API

The following features are intended to be used in child windows. 

### window.parent
The parent/opening window. This is a standard `Window` property, available inside any iframe. We generally treat our usage of an iframe as an implementation detail, but we do explicitly endorse using `window.parent`.

### SimpleModal.close([value], [then])
Note - you must include SimpleModal.js in the child window for this to be available.

Essentially, this just calls `window.parent.SimpleModal.closeChild(value, then)`.

If the parent is x-origin, `value` must be serializable (since it will be passed to parent via `postMessage`) and `then` is not supported at all.

NOTE - `then` support is currently broken (at least in some browsers)! TODO - fix it

Will throw an error if this window is either not in an iframe, or the parent is same-origin but this window is not a SimpleModal child.

If there is a parent window, and that parent is x-origin, we can't be sure whether or not we are a SimpleModal child. In this case, we ask the parent to close us (via `postMessage` api). If we are not actually a SimpleModal child, nothing will happen.

### SimpleModal.reload() / SimpleModal.replace(url, {animated=False}={})
These behave much like calling `location.reload()` or `location.replace(url)` from inside the modal window. However, we actually create a new iframe and repalce the current one, ensuring that there is no "iframe flicker" (which seems to happen consistently in Chrome when navigating an iframe).

Also, if you're using our animation support, these methods ensure that the entrance animation does _not_ run again.

If you pass `{animated: True}` to `replace`, then the exit/entrance animations _will_ be run (but the backdrop will persist).

Note that unlike `location.reload()`, `SimpleModal.reload()` is not able to persist `history.state` or scroll position.

### SimpleModal.animateOut([then])

DEPRECATED. `SimpleModal.close()` and `SimpleModal.replace(next_url, {animated: true})` should cover all the use cases for triggering exit animations.

Read the "Animation Support" section. This function triggers the "exit animation", just as if you had animation support enabled and called `SimpleModal.close()`. 

## Opt-in Features
A few features are opt-in. You opt-in by setting the `simple-modal-config` attribute on the `<html>` element appropriately. The value should be a space-separated list of keywords. Ie. use `<html simple-modal-config="animate autofocus">` to enable animations and autofocus support.

Currently, all of these optional features are designed to run in the child/modal window, so you must set the attribute there.

### Animation Support
Opt in via `simple-modal-config="animate"`.

When the window loads, we'll add `SimpleModal-animating SimpleModal-opening` classes to the html element. You should use these classes to define a CSS animation on which ever elements you want to animate.

After the entrace animation, we remove both classes.

When you call SimpleModal.close(), we'll add `SimpleModal-animating SimpleModal-closing` to the html element. Use these to define your exit animation.

After the exit animation, the window will be closed.

Tips/notes:
- exit animations are only run when you call `SimpleModal.close()` in from the child window, _not_ if you call `SimpleModal.closeChild()` in the parent
- you must set `animation-duration` on the html element (at least when the `SimpleModal-animating` class is present), even if you don't animate it; this is how we determine how long your animation runs
- you can use the same `animation-name` for entrance and exit animations; just be sure you set it only when `SimpleModal-animating` is present (it must be turned off between entrance and exit animations, or exit animation won't run)
- if using same `animation-name` for entrance and exit, you probably want `animation-direction: reverse` when `SimpleModal-closing` is present
- you probably want `animation-fill-mode: forwards` when `SimpleModal-closing` is present (to ensure the "closed" styles persist while we close the modal layer) 

See extras/AlertModal.css for a sample styles.

### Autofocus

Opt in via `simple-modal-config="autofocus"`.

After window load event, we'll focus the first element with the `simple-modal-autofocus` attribute present (if one exists). 

If you have animations enabled, we delay focusing until the entrance animation has completed (focusing an element while it's animating on-screen can sometimes disrupt the animation).

We use a custom attribute (rather than `autofocus`) because Safari seems automatically focus `autofocus` elements (most browsers don't, inside of dynamically added-iframes), and this can sometimes disrupt your entrance animations (in very markup-, style-, and browser-dependent manner, which is hard to predict).

Whether you use this feature or not, we recommend that you never set `autofocus` on any element inside your modal windows. 

## Events

### simplemodal-load

Requires SimpleModal.js to be included in the child window.

This event is dispatched on child windows after animations have completed. If not using animations, it is fired immediately after the `load` event.

## Other Features of Note

### Backdrop
We add a div with class "SimpleModalBackdrop" behind the iframe. We add an "animating" class when we first add it, and we add "animating closing" when we're removing it (similar to our animation support in child windows).

We recommend you include the following CSS on your site (or something similar):
```css
.SimpleModalBackdrop {
    background-color: rgba(0,0,0,0.25);
    pointer-events: none;
}
.SimpleModalBackdrop.animating {
    animation: 0.3s ease-in SimpleModalBackdrop;
}
.SimpleModalBackdrop.closing {
    animation-direction: reverse;
    /* make sure the offscreen state persists while backdrop is removed */
    animation-fill-mode: forwards;
}
@keyframes SimpleModalBackdrop {
    0% {opacity: 0;}
    100% {opacity: 1;}
}
```

Note: you _could_ implement a "backdrop" just by setting a semi-transparent background color on the html element in your modal pages. However, if your modal pages are slow to load, then the user has no indication that something is happening. By adding the backdrop immediately in the parent window, the user has some feedback that something is loading.

### "Smart Background"
If you open a same-origin document in a modal layer, and there is no `background-color` on the `<html>` element (or if it is transparent), then we'll automatically add a solid white background behind it.

This is mainly to support server generated error pages (ie. 404 pages), which don't usually set an explicit background color. Without this feature, opening a modal layer to a url which returns an error page would be very confusing (the error message would display over top of your window, but having a transparent background, it would be difficult to see).

Your modal pages should be sure to set an explicit, not-completely-transparent `background-color` on the `html` element. If you want a virtually transparent background, use `rgba(0,0,0,0.004)`. This is roughly equivalent to `#00000001`, which seems to be the least opaque value that is not treated as equivalent to `transparent` by any browsers (#RGBA and #RRGGBBAA hex notation are not supported in IE, so don't use `#00000001` if you're supporting IE). 

## Warnings/Caveats
We don't recommend creating any additional history entries from within the modal window. TODO: explain why.

## Child Window Styles/Animations

It's up to the child window to position/style itself within the browser viewport, create any "modal window chrome", and provide any entrance/exit animations.

We provide [AlertModal.css](./extras/AlertModal.css), which you can use on your SimpleModal child pages. Feel free to use these as a starting point, and edit as desired.

## Things We Might Add Later

### SimpleModal.getChild() -> Window | null

### SimpleModal.isChild() -> Boolean

### SimpleModal.storage
Idea - with same-origin parent, window.parent holds the key prefix
If x-origin, don't use a prefix - assume you're the topmost layer on this domain

## TODO
- more thorough `container` tests
- more thorough focus blocking/restoring tests
- ability to opt-out of tabindex/aria-hidden manipulation