// child.js adds global event listeners
import './child.js';
import * as layerManager from './layerManager.js';

// Parent window API
export function open(url, {
    onload=null,
    onclose=null,
    // Currently only used for testing (fake x-origin)
    // TODO - should we document? Users might want sandbox x-origin frames
    sandbox=null,
    covering=null,
}={}) {
    const layer = {
        sandbox: sandbox,
        onload: onload,
        onclose: onclose,
        promiseResolver: null,
        covering: covering,
    }
    layerManager.open(layer, url);

    // Return a promise, but only if Promise() is implemented in browser
    try {
        return new Promise((resolve, reject) => {
            layer.promiseResolver = resolve;
        });
    } catch (e) {}
}
export function closeChild(value) {
    const layer = layerManager.top();
    if (!layer) throw new Error('No modal window is open');
    layerManager.resolve(layer, value);   
}

// public child window API
export {
    close,
    reload,
    replace,
} from './child.js';

export {
    // TODO - document
    updatePositions,

    // various functions that child window needs, but we probably won't document
    layerForWindow, 
    resolve as resolveLayer, 
    replace as replaceLayer
} from './layerManager.js';
