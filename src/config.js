/*
    Read "configuration" from data-simple-modal-config attribute on html element
    Intended mainly for features on child pages, but we might add optional parent page features here, too.
*/
const opts = (document.documentElement.getAttribute('simple-modal-config')||'').split(' ');
export default {
    autofocus: opts.indexOf('autofocus') != -1,
    animate: opts.indexOf('animate') != -1,
}