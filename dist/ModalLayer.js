/*!
  ModalLayer.js
  version: 1.0.0
  author: Alex Fischer
  homepage: https://github.com/a-p-f/ModalLayer
*/
var ModalLayer=function(e){"use strict";var t,n,o,r,i,a,l;addEventListener("scroll",(function(){a&&(document.documentElement.scrollTop=r,document.documentElement.scrollLeft=i)}));var d=null;function c(){if(d)throw new Error("iframe already exists!");var e,c,u;e=document.documentElement,c=e.style,u=document.body.style,n=u.overflowX,o=u.overflowY,t=c.maxWidth,r=e.scrollTop,i=e.scrollLeft,a=!0,c.maxWidth=e.clientWidth+"px",u.overflowX="hidden",u.overflowY="hidden",l=function(){var e=document.activeElement;try{for(;e&&e.contentDocument&&e.contentDocument.activeElement;)e=e.contentDocument.activeElement}catch(e){}return e}(),addEventListener("click",s,!0),document.documentElement.addEventListener("focus",f,!0);var m=(d=document.createElement("iframe")).style;return m.position="fixed",m.top=0,m.left=0,m.width="100%",m.height="100%",m.border="none",m.margin=0,m.padding=0,m.visibility="hidden",m.zIndex=2147483647,m.zIndex=9007199254740991,d.setAttribute("role","dialog"),d.setAttribute("aria-modal","true"),document.body.appendChild(d),d.focus(),d}function u(){var e,r;d&&(d.parentElement.removeChild(d),removeEventListener("click",s,!0),document.documentElement.removeEventListener("focus",f,!0),l&&l.focus(),l=null,d=null,e=document.documentElement.style,r=document.body.style,a=!1,r.overflowY=o,r.overflowX=n,e.maxWidth=t)}function s(e){e.stopPropagation(),e.preventDefault()}function f(){document.activeElement!=d&&d.focus()}var m=null;function h(){try{return history.state}catch(e){return null}}function v(){var e=window.name.match(/^ModalLayer-dirty-initial-history-position-(\d+):(.*)/);return e&&{position:parseInt(e[1]),name:e[2]}}function w(){return Boolean(v())}function y(){history.replaceState(h(),"",location.href)}function E(e){if(!w())throw new Error("Window is not dirty!");var t=v();window.name=t.name,history.pushState(h(),"",location.href);var n=history.length-t.position;n?(m=e,history.go(-1*n)):e()}addEventListener("popstate",(function(){m&&(m(),m=null)})),addEventListener("load",(function(){w()&&E((function(){}))}));var p=null;function L(){if(!p)throw new Error('You have not configured the "opening page url". Please refer to README.');return p}function g(e){var t=document.createElement("a");t.href=e,p=t.href}var _,A,D,b,M,C="modal-layer-opening-page-url",O=document.querySelector("["+C+"]");function x(e){return Boolean(e.contentDocument)}function W(e){if(!x(e))return!1;var t=getComputedStyle(e.contentDocument.documentElement).backgroundColor;return"transparent"==t||"rgba(0, 0, 0, 0)"==t}O&&g(O.getAttribute(C)),addEventListener("message",(function(e){if(_&&e.source==_.contentWindow)return"MODAL_LAYER_OPENING_PAGE_OPENED"==e.data?(window.name="ModalLayer-dirty-initial-history-position-"+(history.length-1)+":"+window.name,_.onload=M,void(_.src=A)):void("MODAL_LAYER_OPENING_PAGE_RETURNED"!=e.data?(e.data&&"CLOSE_MODAL_LAYER_CHILD"==e.data.message&&I(e.data.value),e.data&&"modal_layer_child_titled"in e.data&&_.setAttribute("aria-label",e.data.modal_layer_child_titled)):I())})),addEventListener("message",(function(e){if(window.parent!=window&&e.source==window.parent&&"MODAL_LAYER_CHILD_LOADED"==e.data){var t=document.querySelector("[autofocus]");t&&t.focus(),window.parent.postMessage({modal_layer_child_titled:document.title},"*")}}));var Y=!1;function I(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null,t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null;if(Y)throw new Error("ModalLayer is already in the process of closing a modal child.");function n(){D(e),b&&b(e),Y=!1,_=null,D=null,b=null,t&&t(window)}Y=!0,u(),E(n)}function R(){var e=window.parent!=window&&window.parent.ModalLayer;return e&&e.getChild()==window?e:null}return e.close=function(){var e,t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,o=!1;try{e=R()}catch(e){o=!0}if(e)e.closeChild(t,n);else{if(!o)throw new Error("This window is not a ModalLayer child.");if(n)throw new Error('"then" callback to ModalLayer.close is not supported in cross origin layers.');parent.postMessage({value:t,message:"CLOSE_MODAL_LAYER_CHILD"},"*")}},e.closeChild=I,e.getChild=function(){return _&&_.contentWindow||null},e.open=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=t.onload,o=void 0===n?function(e){}:n,r=t.onclose,i=void 0===r?function(e){}:r,a=t.sandbox,l=void 0===a?null:a;if(_)throw new Error("A ModalLayer is already open. A window may only open one ModalLayer at a time. We may relax this in the future, but for now, that's the deal.");var d=L();y(),_=c(),D=i,A=e,null!==l&&_.setAttribute("sandbox",l),M=function(){if(_.style.backgroundColor=W(_)?"white":"",x(_)){var e=_.contentDocument.querySelector("[autofocus]");e&&e.focus(),_.setAttribute("aria-label",_.contentDocument.title)}else _.contentWindow.postMessage("MODAL_LAYER_CHILD_LOADED","*");o(_.contentWindow),_.style.visibility=""},_.src=d;try{return new Promise((function(e,t){b=e}))}catch(e){}},e.set_opening_page_url=g,e}({});
