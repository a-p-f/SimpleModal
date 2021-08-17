/*
Provides a (x-domain) means for opening window to pass data to child window, which will be available BEFORE child window has fully loaded. The information is _only_ available on the first load in the child window (not intentionally, but that's all this implementation gives us, and it's all we need).

Note - we _could_ try to use iframe.name to pass this info, but I could easily see browsers ceasing to allow x-domain information passage via iframe.name, since it's not intended for this.
*/

const ANIMATE = '#_SimpleModalAnimate_';

export function setting(url, {animate}) {
    if (animate) url += ANIMATE;
    return url
}

// Reminder - IE sometimes throws error when trying to read history.state when state was set in another frame
function safeReadState() {
    try {return history.state}
    catch (e) {return null}
}

export function readAndClean() {
    const config = {
        animate: location.hash.indexOf(ANIMATE) != -1,
    };

    // If any flags were present, clean url
    if (config.animate) {
        history.replaceState(safeReadState(), '', location.href.replace(ANIMATE, ''));

        // TODO - add a test to make sure this works (in all browsers)
        const id = location.hash.slice(1);
        const target = id && document.getElementById(id);
        target && target.scrollIntoView();
    }

    return config;
}