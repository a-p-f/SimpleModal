let maxWidth, overflowX, overflowY;
let scrollTop, scrollLeft, isLocked;
export function lockScroll() {
	const de = document.documentElement;
	const ds = de.style;
	const bs = document.body.style;	

	// Save style values so we can restore
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
	ds.maxWidth = de.clientWidth + 'px';

	// Now lock scrolling
	bs.overflowX = 'hidden';
	bs.overflowY = 'hidden';
}
export function releaseScroll() {
	const ds = document.documentElement.style;
	const bs = document.body.style;

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
addEventListener('scroll', function() {
	if (!isLocked) return
	document.documentElement.scrollTop = scrollTop;
	document.documentElement.scrollLeft = scrollLeft;
})