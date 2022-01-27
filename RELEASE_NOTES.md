### 2.6.4
Prevent programmatic/automatic focus of covered content.

We shouldn't have to do this, but we found a case (hard to reproduce), where Safari was focusing a username input on the parent page when it had a modal open. This feature is mainly to protect against that.

### 2.6.3
Publish unminified code with sourcemap

### 2.6.2
Document the "animated" option to `replace`.

### 2.6.1
Bug fix when using `replace()` inside a modal with `container` set

## 2.6.0
Add simplemodal-load event

### 2.5.2
Document that `then` callback support is broken

### 2.5.1
Fixed relative url handling in replace()

## 2.5.0
Finished testing recent features and fixed bugs.

## 2.5.0-rc
Added `.SimpleModalBackdrop` support.

## 2.4.0-rc
Added `animateOut(then)` to child window API.

## 2.3.0-rc
Added `container` option to `SimpleModal.open()`

## 2.2.0
Added support for concurrent modal windows.
Added `SimpleModal.reload()` and `SimpleModal.replace()`.

## 2.1.0
Built-in animation support, added `simple-modal-autofocus` support.

# 2.0.0
FF iframe focus fix, drop autofocus support (since it can interfere with animations).

# 1.0.0
Initial version. Not heavily tested.