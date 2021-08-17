export function isObject(anything) {
    return anything !== null && typeof anything == 'object'
}
export function getMessage(anything) {
    return isObject(anything) && anything.message;
}
export function postMessage(target, message) {
    target.postMessage({message: message}, '*');
}