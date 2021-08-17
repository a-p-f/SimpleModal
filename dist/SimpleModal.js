/*!
  SimpleModal.js
  version: 2.2.0
  author: Alex Fischer
  homepage: https://github.com/a-p-f/SimpleModal
*/
var SimpleModal=function(e){"use strict";var n=(document.documentElement.getAttribute("simple-modal-config")||"").split(" "),o=-1!=n.indexOf("autofocus"),t=-1!=n.indexOf("animate");function i(e){return(i="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function r(e){return function(e){return null!==e&&"object"==i(e)}(e)&&e.message}function a(e,n){e.postMessage({message:n},"*")}function l(){var e=document.querySelector("[simple-modal-autofocus]");e&&e.focus()}function c(e){var n=document.documentElement,o=parseFloat(getComputedStyle(n).animationDuration);setTimeout(e,1e3*o)}window.parent!=window&&addEventListener("message",(function(e){if(e.source==window.parent){var n=e.data;"PREPARE_SIMPLE_MODAL_CHILD"==r(n)&&prepare_window(n.skipAnimation),"CANCEL_SIMPLE_MODAL_ANIMATIONS"==r(n)&&(t&&w(),a(window.parent,"SIMPLE_MODAL_ANIMATIONS_CANCELED"))}}));var d,s,u,m,f,v,p=!1;function w(){if(!p){p=!0;var e=document.documentElement;e.classList.remove("SimpleModal-opening"),e.classList.remove("SimpleModal-animating"),o&&l()}}function E(e){var n=document.documentElement;n.classList.add("SimpleModal-closing"),n.classList.add("SimpleModal-animating"),c(e)}function L(){if(window.parent==window)throw new Error("This is not a SimpleModal child window (it's not even in iframe)")}function y(){try{return Boolean(window.parent.location.hostname)}catch(e){return!1}}function h(){var e=window.parent.SimpleModal&&window.parent.SimpleModal.layerForWindow(window);if(!e)throw new Error("This is not a SimpleModal child window");return e}function g(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null;if(L(),y()){var o=h();return window.parent.SimpleModal.resolveLayer(o,e),void(n&&n())}if(n)throw new Error('"then" callback to SimpleModal.close is not supported in cross origin layers.');parent.postMessage({value:e,message:"CLOSE_SIMPLE_MODAL_CHILD"},"*")}function M(e){parent.postMessage({message:"REPLACE_SIMPLE_MODAL",url:e},"*")}function S(e){var n=document.createElement("iframe"),o=n.style;return o.position="fixed",o.top=0,o.left=0,o.width="100%",o.height="100%",o.border="none",o.margin=0,o.padding=0,o.opacity=0,o.zIndex=2147483647,o.zIndex=9007199254740991,n.setAttribute("role","dialog"),n.setAttribute("aria-modal","true"),null!==e&&n.setAttribute("sandbox",e),n}function b(){if(!v){var e=document.documentElement,n=e.style,o=document.body.style;s=o.overflowX,u=o.overflowY,d=n.maxWidth,m=e.scrollTop,f=e.scrollLeft,v=!0,n.maxWidth=e.clientWidth+"px",o.overflowX="hidden",o.overflowY="hidden"}}addEventListener("load",(function(){if(t){document.querySelector("[autofocus]")&&console.warn("autofocus not recommended when using SimpleModal animations. Can sometimes break animations in Safari, but only in certain situations.");var e=document.documentElement;e.classList.add("SimpleModal-opening"),e.classList.add("SimpleModal-animating"),c((function(){w()}))}else o&&l()})),addEventListener("scroll",(function(){v&&(document.documentElement.scrollTop=m,document.documentElement.scrollLeft=f)}));var A,_=[];function C(e){if(!function(e){try{return Boolean(e.contentDocument)}catch(e){return!1}}(e))return!1;var n=getComputedStyle(e.contentDocument.documentElement).backgroundColor;return"transparent"==n||"rgba(0, 0, 0, 0)"==n}function I(e){var n=e.iframe;n.style.backgroundColor=C(n)?"white":"",e.replaces?a(e.iframe.contentWindow,"CANCEL_SIMPLE_MODAL_ANIMATIONS"):e.iframe.style.opacity="",W(),e.onload&&e.onload(e.iframe.contentWindow)}function D(){var e=document.activeElement;try{for(;e&&e.contentDocument&&e.contentDocument.activeElement;)e=e.contentDocument.activeElement}catch(e){}return e}function O(e){for(var n=0;n<_.length;n++)if(_[n].iframe.contentWindow==e)return _[n]}function x(){return _[_.length-1]}function P(e,n){var o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};o.animate;0==_.length&&(A=D(),b(),T()),_.push(e);var t=e.iframe;document.body.appendChild(t),t.addEventListener("load",I.bind(null,e)),t.focus(),t.src=n}function N(e,n){var o,t,i=_.indexOf(e);if(-1==i)throw new Error("Layer is not in layers.");_.splice(i,1),e.iframe.parentElement&&e.iframe.parentElement.removeChild(e.iframe),0==_.length?(o=document.documentElement.style,t=document.body.style,v=!1,t.overflowY=u,t.overflowX=s,o.maxWidth=d,A&&A.focus(),document.documentElement.removeEventListener("focus",W,!0),removeEventListener("message",k)):W(),e.onclose&&e.onclose(n),e.promiseResolver&&e.promiseResolver(n)}function R(e,n){var o={sandbox:e.sandbox,iframe:S(e.sandbox),onload:e.onload,onclose:e.onclose,promiseResolver:e.promiseResolver};e.onload=null,e.onclose=null,e.promiseResolver=null,o.replaces=e,P(o,n,{animate:!1})}function T(){document.documentElement.addEventListener("focus",W,!0),addEventListener("message",k)}function W(){var e=x();e&&e.iframe!=document.activeElement&&e.iframe.focus()}function k(){var e=O(event.source);if(e){var n=event.data;"CLOSE_SIMPLE_MODAL_CHILD"==r(n)&&(N(e,event.data.value),closeChild(event.data.value)),"REPLACE_SIMPLE_MODAL"==r(n)&&R(e,n.url),"SIMPLE_MODAL_ANIMATIONS_CANCELED"==r(n)&&(e.iframe.style.opacity="",N(e.replaces),e.replaces=null)}}return e.close=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null;function o(){g(e,n)}t?E(o):o()},e.closeChild=function(e){var n=x();if(!n)throw new Error("No modal window is open");N(n,e)},e.layerForWindow=O,e.open=function(e){var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},o=n.onload,t=void 0===o?null:o,i=n.onclose,r=void 0===i?null:i,a=n.sandbox,l=void 0===a?null:a,c={sandbox:l,iframe:S(l),onload:t,onclose:r,promiseResolver:null};P(c,e);try{return new Promise((function(e,n){c.promiseResolver=e}))}catch(e){}},e.reload=function(){M(location.href)},e.replace=M,e.replaceLayer=R,e.resolveLayer=N,e}({});
