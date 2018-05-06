// Code to permit a popup to be displayed via Java method call. This is not supported out of the box by MAF yet.
// Code was obtained from Keith MacDonald - see forum post: http://myforums.oracle.com/jive3/thread.jspa?threadID=1644178&tstart=0
(function () {
    if (!window.application)
        window.application = {
        };

    var myCustomTriggerEvent = function (eventTarget, eventType, triggerExtra) {
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent(eventType, true, true);
        evt.view = window;
        evt.altKey = false;
        evt.ctrlKey = false;
        evt.shiftKey = false;
        evt.metaKey = false;
        evt.keyCode = 0;
        evt.charCode = 'a';
        if (triggerExtra != null) {
            evt.triggerExtra = triggerExtra;
        }
        eventTarget.dispatchEvent(evt);
    };

    application.tapElement = function () {
        var args = arguments;
        var elemId = args[0];
        var element = document.getElementById(elemId);
        var oldDisplayStyle = element.style.display;
        element.style.display = "block";
        myCustomTriggerEvent(element, "touchstart");
        myCustomTriggerEvent(element, "touchend");
        element.style.display = oldDisplayStyle;
    };
})();