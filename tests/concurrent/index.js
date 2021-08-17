function run() {
    var button = event.target;
    button.focus();
    function count_iframes() {
        return document.querySelectorAll('iframe').length;
    }
    function delay(func) {
        setTimeout(func, 300);
    }
    function is_iframe(element, path) {
        return element && element.contentWindow && element.contentWindow.location.pathname == path
    }
    SimpleModal.open('green.html', {
        onload: function() {
            if (count_iframes() != 1) throw new Error();
            delay(function() {
                SimpleModal.open('blue.html', {
                    onload: function() {
                        if (count_iframes() != 2) throw new Error();
                        if (!is_iframe(document.activeElement, '/tests/concurrent/blue.html')) throw new Error();
                        delay(function() {SimpleModal.closeChild(5)});
                    },
                    onclose: function(value) {
                        if (value != 5) throw new Error();
                        if (count_iframes() != 1) throw new Error();
                        if (!is_iframe(document.activeElement, '/tests/concurrent/green.html')) throw new Error();
                        delay(function() {SimpleModal.closeChild(button)});
                    },
                })
            });
        },
        onclose: function(value) {
            if (count_iframes() != 0) throw new Error();
            if (value !== button) throw new Error();
            if (document.activeElement != button) throw new Error();
            window.close();
        },
    })
}