var opa_screen_initialized = false;

initScreen = function () {
    
    // Do nothing if screen has previously been initalized.
    if (opa_screen_initialized == true) {
        return;
    }

    // Override main form submit
    $("#owdInterviewForm").submit(function (e) {
        e.preventDefault();
        jsPost(this);
    });

    //handle back button
    $("#owdInterviewForm").on("click", ".owd-back", function() {
        jsGet(opa.screenInfo.backButtonURL);
    });

    // Override internal links
    $("a.internalLink").click(function (e) {
        e.preventDefault();
        jsGet($(this).attr('href'));
    });

    // Add 'clicked' attribute to track which button is clicked
    $("button[type=submit]").click(function () {
        $(this).attr("clicked", true);
    });

    // Evaluate screen model
    try {
        var json = $("#interviewScreenObjects").html();
        opa = eval("(" + json + ")"); // JSON.parse(json);
    } catch (e) {
        alert(e.name + ": " + e.message);
    }
    for (var i=0; i < opa.screenInfo.controls.length; i++) {
        opa.screenInfo.controlsByName[opa.screenInfo.controls[i].name] = opa.screenInfo.controls[i];
    }

    // Set active tab in each tab group
    //$("#instanceTabs li").last().addClass("active");
    $(".instanceTabs").each(function() {
        $(this).children("li").last().addClass("active");
    });
    
    $(".instanceViews").each(function() {
        $(this).children(".entity-instance-group").last().addClass("active");
    });
    
    // Textbox onFocus styling
    $('.select-style-text input[type="text"]').blur(function () {
        $(this).parent().removeClass("text-selected");
    });
    $('.select-style-text input[type="text"]').focus(function () {
        $(this).parent().addClass("text-selected");
    });

    // Sidebar button
    /*
    $('#sidebarButton').off(clickEvent).on(clickEvent, function () {
        $('#interviewWrapper').removeClass('startOpen');
        $('#interviewWrapper').toggleClass('sidebarOpen');

        if ($('#interviewWrapper').hasClass('sidebarOpen')) {

        }
        else {

        }

        return false;
    });
    */

    // Swipe
    /*$('#content').os_swipe( {
        os_swipeLeft : function (event, direction, distance, duration, fingerCount) {
            $('#interviewWrapper').removeClass('sidebarOpen startup');

        },
        os_swipeRight : function (event, direction, distance, duration, fingerCount) {
                $('#interviewWrapper').removeClass('startup');
                $('#interviewWrapper').addClass('sidebarOpen');
        },
        threshold : 30, fingers : 'all'
    });

    $('#progress-stages').os_swipe( {
        os_swipeLeft : function (event, direction, distance, duration, fingerCount) {
            $('#interviewWrapper').removeClass('sidebarOpen startup');

        },
        os_swipeRight : function (event, direction, distance, duration, fingerCount) {
            $('#interviewWrapper').addClass('sidebarOpen');
        },
        threshold : 40, fingers : 'all'
    });*/

    //initFade()
    initDirtyCheck();
    try {
        initDynamicControlState();
    } catch(e) {
        alert(e.name + ": " + e.message);
    }
    initCheckboxes();
    initExplanations();
    
    $('.sigPad').each(function() {
       var id = $(this).attr('id');
       
       var canvasWidth = Math.min($(this).closest('form').width() - (parseInt($(this).parent().css('padding-left').replace("px", "")) * 2), 600);    
              
       $(this).width(canvasWidth);
       $(this).find("canvas").attr('width', canvasWidth);
       $(this).signaturePad({drawOnly:true, lineTop:185, onDrawEnd: function() { processSignature(id) } });
    });

    Log.info("Interview page ready");
    opa_screen_initialized = true
};

function navigationButtonPress() {
    if ($('#interviewWrapper').hasClass('sidebarOpen')) {
        $('#interviewWrapper').removeClass('sidebarOpen startup');
    } else {
        $('#interviewWrapper').removeClass('startup')
        $('#interviewWrapper').addClass('sidebarOpen');
    }
}

function getEnteredFormValues() {
    return $("#owdInterviewForm").serializeObject();
}

function jsPost(form) {
    adf.mf.api.amx.showLoadingIndicator();

    var $button = $('button[type=submit][clicked=true]');
    var buttonName = $button.attr('name');

    var $form = $(form);
    var postParams = $form.serializeObject();
    var uri = $form.attr('action');
    
    var attachmentsMap = {};
    if ($('.new_image_file').length > 0 || $('.new_signature').length > 0) {
        attachmentsMap = getNewImageAttachments();
    }

    if (buttonName.indexOf('ADDACTION_') == 0) {
        var containmentRelCtrlId = buttonName.substring(10);
        try {
            opa_screen_initialized = false;
            adf.mf.el.invoke( "#{applicationScope.august2016Interview.addEntityInstance}", [uri, containmentRelCtrlId, postParams, attachmentsMap], "", ["java.lang.String", "java.lang.String", "java.util.HashMap", "java.util.HashMap"],
                function success() {
                    adf.mf.api.amx.hideLoadingIndicator();
                },
                function fail() {
                    Log.severe("INVOCATION ERROR");
                    adf.mf.api.amx.hideLoadingIndicator();
                }
            );
        } catch (err) {
            Log.severe("CORDOVA ERROR");
        }
    } else if (buttonName.indexOf('DELETEACTION_') == 0) {
        var entityInstCtrlId = buttonName.substring(13);
        try {
            opa_screen_initialized = false;
            adf.mf.el.invoke( "#{applicationScope.august2016Interview.deleteEntityInstance}", [uri, entityInstCtrlId, postParams, attachmentsMap], "", ["java.lang.String", "java.lang.String", "java.util.HashMap", "java.util.HashMap"],
                function success() {
                    adf.mf.api.amx.hideLoadingIndicator();
                },
                function fail() {
                    Log.severe("INVOCATION ERROR");
                    adf.mf.api.amx.hideLoadingIndicator();
                }
            );
        } catch (err) {
            Log.severe("CORDOVA ERROR");
        }
    } else {    
        try {
            opa_screen_initialized = false;
            adf.mf.el.invoke( "#{applicationScope.august2016Interview.post}", [uri, postParams, attachmentsMap], "", ["java.lang.String", "java.util.HashMap", "java.util.HashMap"],
                function success() {
                    adf.mf.api.amx.hideLoadingIndicator();
                },
                function fail() {
                    Log.severe("INVOCATION ERROR");
                    adf.mf.api.amx.hideLoadingIndicator();
                }
            );
        } catch (err) {
            //alert(err)
            Log.severe("CORDOVA ERROR");
        }
    }
}

function getNewImageAttachments() {
    var attachmentsMap = {};
    $('.new_image_file').each(function() {
        var fileURI = this.src;
        var attachmentControlId = this.parentNode.parentNode.id.slice(11);
        
        if (attachmentControlId in attachmentsMap) {
            var listForAttachmentControl = attachmentsMap[attachmentControlId];
            listForAttachmentControl.push(fileURI);
        } else {
            var newListForAttachmentControl = [ fileURI ];
            attachmentsMap[attachmentControlId] = newListForAttachmentControl;
        }
    });
    
    $('.new_signature').each(function() {
        var signatureID = this.textContent;
        var attachmentControlId = this.parentNode.id.slice(22);
        
        if (attachmentControlId in attachmentsMap) {
            var listForAttachmentControl = attachmentsMap[attachmentControlId];
            listForAttachmentControl.push(signatureID);
        } else {
            var newListForAttachmentControl = [ signatureID ];
            attachmentsMap[attachmentControlId] = newListForAttachmentControl;
        }
    });
    
    return attachmentsMap;
}

function getNewImageAttachmentsSerialized() {
    return JSON.stringify(getNewImageAttachments());
}

function jsGet(uri) {
    adf.mf.api.amx.showLoadingIndicator();
    if(owdPageIsDirty) {
        if(!confirm(opa.unsubmittedDataWarning.warningMsg)) {
            adf.mf.api.amx.hideLoadingIndicator();
            return;
        }
    }
    try {
        opa_screen_initialized = false;
        adf.mf.el.invoke( "#{applicationScope.august2016Interview.get}", [uri], "", ["java.lang.String"],
            function success() {
                adf.mf.api.amx.hideLoadingIndicator();
            },
            function fail() {
                Log.severe("INVOCATION ERROR");
                adf.mf.api.amx.hideLoadingIndicator();
            }
        );
    } catch (err) {
        Log.severe("CORDOVA ERROR");
    }
}

$.fn.serializeObject = function () {
    var o = {
    };
    var a = this.serializeArray();
    $.each(a, function () {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        }
        else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

function initFade() {
    if (fadeAnimation.fadeInDuration > 0) {
        jQuery("#wrapper").hide();
        jQuery("#wrapper").fadeIn(fadeAnimation.fadeInDuration);
    }

    if (fadeAnimation.fadeOutDuration > 0) {
        var doingActualSubmit = false;
        var buttonClicked;

        jQuery("#owdInterviewForm").submit(function () {
            if (!doingActualSubmit) {
                buttonClicked = jQuery("button[type=submit][clicked=true]")[0];

                if (buttonClicked != null && buttonClicked != undefined) {
                    jQuery("#wrapper").fadeOut(fadeAnimation.fadeOutDuration, actualSubmit);
                    actualSubmit();
                }

                return false;
            }
        });
        function actualSubmit() {
            doingActualSubmit = true;
            buttonClicked.click();
        }
    }
}

function initDirtyCheck() {
    owdPageIsDirty = false;
    var owdMarkPageAsDirty;

    if (opa.unsubmittedDataWarning.isEnabled) {
        var owdPageIsAlwaysDirty = opa.unsubmittedDataWarning.hasUnsubmitted;
        var owdInputControls = [];
        var owdInputKinds = [];
        var owdInputDefaults = [];

        function owdControlValue(ctl, kind) {
            if (kind == "input" && (ctl.type == "radio" || ctl.type == "checkbox"))
                return ctl.checked;
            return ctl.value;
        }

        function owdMakeDirty() {
            var pageIsActuallyDirty = owdPageIsAlwaysDirty;
            var idx, ctl;

            for (idx = 0; idx < owdInputControls.length; idx++) {
                ctl = owdInputControls[idx];
                if (owdControlValue(ctl, owdInputKinds[idx]) !== owdInputDefaults[idx]) {
                    pageIsActuallyDirty = true;
                    break;
                }
            }

            if (!owdPageIsDirty && pageIsActuallyDirty) {
                window.onbeforeunload = function () {
                    return opa.unsubmittedDataWarning.warningMsg;
                }
            } else if (owdPageIsDirty && !pageIsActuallyDirty) {
                window.onbeforeunload = null;
            }
            owdPageIsDirty = pageIsActuallyDirty;
        }

        owdMarkPageAsDirty = function() {
            owdPageIsAlwaysDirty = true;
            owdMakeDirty();
        }

        //attach event handlers
        jQuery("#owdInterviewForm").submit(function () {
            if (owdPageIsDirty) {
                owdPageIsDirty = false;
                window.onbeforeunload = null;
            }
        });

        var inputs = document.getElementsByTagName("input");
        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].className.indexOf("owd-input") >= 0) {
                owdInputControls.push(inputs[i]);
                owdInputKinds.push("input");
                owdInputDefaults.push(owdControlValue(inputs[i], "input"));
                
                inputs[i].onchange = function () {
                    owdMakeDirty();
                };
            }
        }

        var selects = document.getElementsByTagName("select");
        for (var i = 0; i < selects.length; i++) {
            if (selects[i].className.indexOf("owd-input") >= 0) {
                owdInputControls.push(selects[i]);
                owdInputKinds.push("select");
                owdInputDefaults.push(owdControlValue(selects[i], "select"));
                selects[i].onchange = function () {
                    owdMakeDirty();
                }
            }
        }

        if (owdPageIsAlwaysDirty && owdInputControls.length > 0) {
            owdMakeDirty();
        }
    }
}

function htmlDecode(encodedhtml) {
    return $("<div/>").html(encodedhtml).text();
}

function htmlEncode(rawText) {
    return $("<div/>").text(rawText).html();
}

function initDynamicControlState() {
    function changeCtrlState(ctrlInfo, state){
        var div = $("#cd-" + ctrlInfo.id.replace(".", "\\."));
        var ctrlType = ctrlInfo.type;
        var inputType = ctrlInfo.inputType;

        if (state === "hidden") {
            if (div.hasClass("owd-entity-table-cell")) {
                div.children("div").hide();
                div.addClass("owd-responsive-hide");

                var msgCell = $("#cmc-" + ctrlInfo.id.replace(".", "\\."));
                if (msgCell.length > 0) {
                    msgCell.children("div").hide();
                    msgCell.addClass("owd-responsive-hide")
                }
            } else {
                div.hide();
            }

            div.find("[aria-hidden]").attr("aria-hidden", "true").attr("aria-disabled", "false").attr("aria-required", "false");
        } else {
            if (state === "enabled") {
                div.find("img.mandatory").show();
                div.find("img.mandatory-table").show();
                if (ctrlType === "BooleanInputControl") {
                    var uncertainOpt = div.find('input[type="radio"][value=""]');
                    if (uncertainOpt) {
                        uncertainOpt.attr("style", "display: none");
                        uncertainOpt.hide();
                        div.find('label[id="' + uncertainOpt.attr('aria-labelledby') + '"]').hide();
                    }
                }
                div.find("[aria-hidden]").attr("aria-hidden", "false").attr("aria-disabled", "false").attr("aria-required", "true");
            } else {
                div.find("img.mandatory").hide();
                div.find("img.mandatory-table").hide();
                if (ctrlType === "BooleanInputControl") {
                    var uncertainOpt = div.find('input[type="radio"][value=""]');
                    if (uncertainOpt) {
                        uncertainOpt.attr("style", "");
                        uncertainOpt.show();
                        div.find('label[id="' + uncertainOpt.attr('aria-labelledby') + '"]').show();
                    }
                }

                div.find("[aria-hidden]").attr("aria-hidden", "false").attr("aria-required", "false");
            }

            var isReadOnly = state === "readonly";

            if(isReadOnly) {
                div.find("[aria-hidden]").attr("aria-disabled", "true")
                resetValue(ctrlInfo);
            } else {
                div.find("[aria-hidden]").attr("aria-disabled", "false")
            }

            if (inputType === "Calendar") {
                var input = $('[name="' + ctrlInfo.name + '"]');

                if (isReadOnly) {
                    input.attr("disabled", true);
                } else {
                    input.removeAttr("readonly");
                }

            } else if (inputType === "dmy-inputs") {
                var dayInput = $('[name="' + ctrlInfo.dayName + '"]');
                var monthInput = $('[name="' + ctrlInfo.monthName + '"]');
                var yearInput = $('[name="' + ctrlInfo.yearName + '"]');

                if (isReadOnly) {
                    dayInput.attr("disabled", true);
                    monthInput.attr("disabled", true);
                    yearInput.attr("readonly", true);
                } else {
                    dayInput.removeAttr("disabled");
                    monthInput.removeAttr("disabled");
                    yearInput.removeAttr("readonly");
                }
            } else {
                div.find(":input").each(function () {
                    var input = $(this);

                    if (input.is('input[type="text"]') || input.is('textarea')) {
                        if (isReadOnly) {
                            input.attr("readonly", true);
                        } else {
                            input.removeAttr("readonly");
                        }
                    } else {
                        if (isReadOnly) {
                            input.attr("disabled", true);
                        } else {
                            input.removeAttr("disabled");
                        }
                    }
                });
            }



            if (div.hasClass("owd-entity-table-cell")) {
                div.children("div").show();
                div.removeClass("owd-responsive-hide");

                var msgCell = $("#cmc-" + ctrlInfo.id.replace(".", "\\."));
                if (msgCell.length > 0) {
                    msgCell.children("div").show();
                    msgCell.removeClass("owd-responsive-hide")
                }
            } else {
                div.show();
            }

            div.show();
        }
    }

    function resetValue(ctrlInfo){
        //reset value back to the current tactual value
        if(ctrlInfo.inputType === "dmy-inputs"){
            $('[name="' + ctrlInfo.dayName + '"]').val(ctrlInfo.actDayVal);
            $('[name="' + ctrlInfo.monthName + '"]').val(ctrlInfo.actMonthVal);
            $('[name="' + ctrlInfo.yearName + '"]').val(ctrlInfo.actYearVal);
        } else if(ctrlInfo.inputType === "checkbox"){
            var jCtrl = $('#' + ctrlInfo.id.replace(".", "\\."));
            if(ctrlInfo.actValue === "true")
                jCtrl.attr("checked", "");
            else
                jCtrl.removeAttr("checked");
            jCtrl.trigger("change");
        } else if(ctrlInfo.inputType === "Calendar") {
            var val = ctrlInfo.actYearVal != "" ? new Date(ctrlInfo.actYearVal, ctrlInfo.actMonthVal - 1, ctrlInfo.actDayVal, 0, 0, 0, 0) : null;
            $('[name="' + ctrlInfo.name + '"]').val(val);
        } else if(ctrlInfo.inputType === "Radiobutton"){
            var jCtrl = $('[name="' + ctrlInfo.id + '"]');
            var changed = false;
            for(var i =0; i < jCtrl.length; ++i){
                var radio = jCtrl[i];
                if(radio.value === ctrlInfo.actValue && !radio.checked){
                    radio.checked = true;
                    changed = true;
                    break;
                }
            }

            if(changed)
                jCtrl.trigger("change");
        } else {
            var jCtrl = $('[name="' + ctrlInfo.id + '"]');
            jCtrl.val(ctrlInfo.actValue);
            jCtrl.trigger("change");
        }
    }

    function getCtrlState(ctrlId){
        var div = $("#cd-" + ctrlId.replace(".", "\\."));
        if(div.length == 0 ||  div.find('[aria-hidden="true"]').length > 0)
            return "hidden";
        if( div.find('[aria-disabled="true"]').length > 0)
            return "readonly";
        if( div.find('[aria-required="false"]').length > 0)
            return "optional";

        return "enabled";
    }

    function getValue(ctrl, dataType, asString) {
        var stringVal;

        if (ctrl.is('input[type="radio"]')) {
            for (var i = 0; i < ctrl.length; ++i) {
                var el = ctrl[i];
                if (el.checked) {
                    stringVal = el.value;
                    break;
                }
            }
        } else if (ctrl.is('input[type="checkbox"]')) {
            stringVal = ctrl.is(":checked") ? "true" : "false";
        } else {
            stringVal = ctrl.val();
        }

        stringVal = $.trim(stringVal);

        if(asString === true)
            return stringVal;

        if (dataType === 1) {
            //boolean val
            if (stringVal === "true" || stringVal.toLowerCase() === opa.dataFormats.bool.trueVal.toLowerCase()) {
                return true;
            } else if (stringVal === "false" || stringVal.toLowerCase() === opa.dataFormats.bool.falseVal.toLowerCase()) {
                return false;
            } else {
                return "";
            }
        } else if (dataType === 2) {
            return stringVal;
        } else if (dataType === 4 || dataType === 8) {
            //number val
            if (stringVal === "")
                return "";
            var doubleVal = parseFloat(stringVal);
            return isNaN(doubleVal) ? null : doubleVal;
        } else {
            throw "Only booleans, strings and numbers are currently supported";
        }
    }

    function filterChildEnumOptions(parentCtrlName) {
        var parentCtrlInfo = opa.screenInfo.controlsByName[parentCtrlName];
        var filterRules = filterRulesHash[parentCtrlName];
        var parentCtrlState = getCtrlState(parentCtrlInfo.id);
        var parentCtrl = $('[name="' + parentCtrlName + '"]');
        var parentVal = parentCtrlState !== "hidden" ? getValue(parentCtrl, parentCtrlInfo.dataType, true) : "";


        for(var i = 0; i < filterRules.length; ++i) {
            var rule = filterRules[i];

            var childCtrlInfo = opa.screenInfo.controlsByName[rule.childCtrlName];
            var childCtrl = $('[name="' + rule.childCtrlName + '"]');
            var currentVal = getValue(childCtrl, childCtrlInfo.dataType);

            var childVals = rule.values[parentVal];

            if (childCtrlInfo.inputType == "Radiobutton") {
                var parent = $(childCtrl[0].parentElement);
                parent.empty();

                var defaultRadio;
                var found = false;
                for (var j = 0; j < childVals.length; ++j) {
                    var val = childVals[j];
                    var radio = $('<input class="owd-input" type="radio">')
                        .attr("name", childCtrlInfo.name)
                        .attr("id", childCtrlInfo.id + j)
                        .attr("value", val.value)
                        .attr("aria-labelledby", "lbl-" + childCtrlInfo.id + j);
                    parent.append(radio);

                    var radioRules = filterRulesHash[childCtrlInfo.name];
                    if(radioRules !== undefined) {
                        radio.change(function () {
                            filterChildEnumOptions(childCtrlInfo.name)
                        });
                    }

                    if(val.value === "")
                        defaultRadio = radio;

                    if (val.value == currentVal){
                        found = true;
                        radio.attr("checked", true);
                    }

                    var lbl = $("<label>")
                        .attr("for", childCtrlInfo.id + j)
                        .attr("id", "lbl-" + childCtrlInfo.id + j)
                        .text(htmlDecode(val.display));
                    lbl.insertAfter(radio);
                    lbl.prepend("<span></span>")
                    $("<br>").insertAfter(lbl);
                }

                if(!found)
                    defaultRadio.attr("checked", true);
            } else {
                if (childCtrl.length == 0)
                    return;

                childCtrl.empty();
                var found = false;
                for (var j = 0; j < childVals.length; ++j) {
                    var item = childVals[j];

                    var display = item.display === "" ? "&nbsp;" : item.display;
                    var opt = new Option(htmlDecode(display));
                    opt.value = item.value;
                    if (item.value === currentVal) {
                        opt.selected = true;
                        found = true;
                    }
                    childCtrl.append(opt);
                }

                if (!found) {
                    childCtrl.val("");
                    childCtrl.trigger("change");
                }

                if (childCtrl.data("ui-combobox") !== undefined) {
                    childCtrl.data("ui-combobox").initOptions();
                }
            }

            var ctrlState = controlStates[childCtrlInfo.id];
            ctrlState.filtered = (parentCtrlState === 'hidden' || parentVal == "") ? "readonly" : "enabled";
            var currentState = getCtrlState(childCtrlInfo.id);

            var newState;
            if(ctrlState.calculated === "hidden")
                newState = "hidden";
            else if(ctrlState.filtered === "readonly")
                newState = "readonly";
            else
                newState == ctrlState.calculated;

            if(newState !== currentState){
                changeCtrlState(childCtrlInfo, newState);
                if(newState === "readonly")
                    resetValue(childCtrlInfo);
            }

        }
    }


    //init dynamic conditions
    function initCtrlStateExpr(exprDef) {
        if (exprDef.isConstant) {
            return new OPAControlStateEvaluator.ConstantExpression(exprDef.result);
        } else {
            var ctrl = ctrlsById[exprDef.attrCtrlName];
            if (!ctrl) {
                var state = opa.screenInfo.controlsByName[exprDef.attrCtrlName].state;
                ctrl = new OPAControlStateEvaluator.Control(exprDef.attrCtrlName, state);
                controls.push(ctrl);
                ctrlsById[ctrl.id] = ctrl;
            }

            if (!ctrl.initForExpr) {
                ctrl.initForExpr = true;
                var jqCtrl = $("[name=\"" + exprDef.attrCtrlName + "\"]");
                ctrl.value = getValue(jqCtrl, exprDef.exprValType);
                jqCtrl.change(function () {
                    stateEngine.setControlValue(exprDef.attrCtrlName, getValue(jqCtrl, exprDef.exprValType));
                    stateEngine.evaluate();
                });
            }

            return new OPAControlStateEvaluator.DynamicExpression(exprDef.attrCtrlName, exprDef.exprType, exprDef.exprOp, exprDef.exprVals);
        }
    }

    var rules = [];
    var controls = [];
    var ctrlsById = {};
    var stateEngine;

    var controlStates = {};
    for(var i = 0; i < opa.screenInfo.controls.length; ++i){
        var ctrlInfo = opa.screenInfo.controls[i];
        controlStates[ctrlInfo.id] = {"calculated": ctrlInfo.state, "filtered": "enabled"};
    }



    for (var i = 0; i < opa.controlRules.length; ++i) {
        var ruleDef = opa.controlRules[i];

        var hideIfExpr = initCtrlStateExpr(ruleDef.hideIfExpr);
        var readOnlyIfExpr = initCtrlStateExpr(ruleDef.readOnlyIfExpr);
        var optionalIfExpr = initCtrlStateExpr(ruleDef.optionalIfExpr);

        var rule = new OPAControlStateEvaluator.ControlStateRule(ruleDef.ctrlName, hideIfExpr, readOnlyIfExpr, optionalIfExpr, ruleDef.defaultState);
        rules.push(rule);

        if (!ctrlsById[ruleDef.ctrlName]) {
            var state = opa.screenInfo.controlsByName[ruleDef.ctrlName].state;
            var ctrl = new OPAControlStateEvaluator.Control(ruleDef.ctrlName, state);
            controls.push(ctrl);
            ctrlsById[ctrl.id] = ctrl;
        }

    }

    stateEngine = new OPAControlStateEvaluator.Engine(rules, controls);
    stateEngine.onStateChange = function (controls) {
        for (var i = 0; i < controls.length; ++i) {
            var ctrl = controls[i];
            var ctrlInfo = opa.screenInfo.controlsByName[ctrl.id];
            var ctrlState =  controlStates[ctrlInfo.id];
            var state = ctrl.state;
            if(ctrl.state === "enabled" && ctrlState.filtered === "readonly")
                state= "readonly";

            changeCtrlState(ctrlInfo, state);
            ctrlState.calculated = ctrl.state;
        }

        for(var i = 0; i < controls.length; ++i){
            if(filterRulesHash[ctrl.id] != undefined){
                filterChildEnumOptions(ctrl.id);
            }
        }

        stateEngine.evaluate();
    }

    $("#owdInterviewForm").append($('<input name="__DYNAMIC_CONTROL_STATE" type="hidden" value="true"/>'));

    var filterRulesHash = {};
    //init enumeration filters
    for(var i =0; i < opa.listFilterRules.length; ++i){
        var filterRule = opa.listFilterRules[i];
        var parentCtrl = $('[name="' + filterRule.parentCtrlName + '"]');
        if(parentCtrl.length > 0) {
            var filters = filterRulesHash[filterRule.parentCtrlName];
            if(filters === undefined){
                filters = [];
                filterRulesHash[filterRule.parentCtrlName] = filters;
            }

            filters.push(filterRule);
            parentCtrl.change(function () {
                filterChildEnumOptions(this.name)
            });

        }
    }

    for(var key in filterRulesHash){
        filterChildEnumOptions(key);
    }

    stateEngine.evaluate();
}

function initCheckboxes() {
    //boolean attribute checkbox controls
    var ctrls = opa.screenInfo.controls;
    for(var i = 0; i < ctrls.length; ++i){
        var ctrlInfo = ctrls[i];
        if(ctrlInfo.type === "BooleanInputControl" && ctrlInfo.inputType === "checkbox"){
            var checkbox = $('#' + ctrlInfo.id.replace(".", "\\."));
            checkbox.attr('name', ctrlInfo.name + "-cb");

            var val = checkbox.is(':checked') ? "true" : "false";
            checkbox.parent().append('<input type="hidden" value="' + val + '" name="' + ctrlInfo.name  + '" id="__cbHiddenInput__' + ctrlInfo.id + '">');

            checkbox.on("change", function(){
                var $this = $(this);
                var shadowCtrl = $('#__cbHiddenInput__' + $this.attr('id').replace(".", "\\."));
                var val = $this.is(':checked') ? "true" : "false";
                shadowCtrl.attr("value", val);
           });
        }
    }
}

function initExplanations() {
    jQuery('.explanation').each(function () {
        var caption = jQuery('.explanation_caption', this);
        var imgNode = caption.children('img').first();
        var details = jQuery('.explanation_details', this);

        //non-empty decision report
        if (details.length !== 0) {
            details.hide();

            var anchor = caption.children('.explanation-node-text').first();
            //initialise the caption
            anchor.addClass('explanation-tree-parent');
            caption.click(function (event) {
                details.toggle('blind');
                var src = imgNode.attr('src') == explanationParams.captionCollapseImage ? explanationParams.captionExpandImage : explanationParams.captionCollapseImage;
                var alt = src == explanationParams.captionCollapseImage ? explanationParams.nodeCollapseAlt : explanationParams.nodeExpandAlt
                imgNode.attr('src', src);
                imgNode.attr('alt', alt);
                //Oliver:
                $(this).toggleClass('treeOpen');
            });

            anchor.keydown(function (event) {
                // handle cursor keys
                if (event.keyCode == 37) {
                    details.hide('blind');
                    imgNode.attr('src', explanationParams.captionExpandImage).attr('alt', explanationParams.nodeExpandAlt);
                }
                if (event.keyCode == 39) {
                    details.show('blind');
                    imgNode.attr('src', explanationParams.captionCollapseImage).attr('alt', explanationParams.nodeCollapseAlt);
                }
            });
            anchor.click(function (event) {
                event.preventDefault();
            })

            //initialise every node in the decision report
            jQuery('li', details).each(function () {
                var node = jQuery(this);
                var childContent = jQuery(this).children('ul').first();
                var imgNode = node.children("img").first();

                if (childContent.length !== 0) {
                    childContent.hide();
                    imgNode.attr('src', explanationParams.nodeExpandImage).attr('alt', explanationParams.nodeExpandAlt);

                    node.click(function (event) {
                        childContent.toggle('blind');
                        var src = imgNode.attr('src') === explanationParams.nodeExpandImage ? explanationParams.nodeCollapseImage : explanationParams.nodeExpandImage;
                        var alt = imgNode.attr('alt') === explanationParams.nodeExpandImage ? explanationParams.nodeExpandAlt : explanationParams.nodeCollapseAlt;
                        imgNode.attr('src', src).attr('alt', alt);
                        event.stopPropagation();
                        //Oliver:
                        $(this).toggleClass('treeOpen');
                    });

                    var anchor = node.children('.explanation-node-text').first();
                    anchor.addClass('explanation-tree-parent');
                    anchor.keydown(function (event) {
                        // handle cursor keys
                        if (event.keyCode == 37) {
                            childContent.hide('blind');
                            imgNode.attr('src', explanationParams.nodeExpandImage).attr('alt', explanationParams.nodeExpandAlt);
                            event.stopPropagation()
                        } else if (event.keyCode == 39) {
                            childContent.show('blind');
                            imgNode.attr('src', explanationParams.nodeCollapseImage).attr('alt', explanationParams.nodeCollapseAlt);
                            event.stopPropagation()
                        }

                    });

                    anchor.click(function (event) {
                        //this will stop the browser history from expand/contract something
                        event.preventDefault();
                    });

                } else {
                    //add dummy click handler to stop events from propagating
                    node.click(function (event) {
                        event.stopPropagation();
                    })
                }


                //handling for the "see above for proof"
                var prevNodeRef = node.children('.explanation-proven-ref');

                if (prevNodeRef.length !== 0) {
                    prevNodeRef.click(function (event) {
                        //ie #somenodeid
                        var refNodeId = prevNodeRef.attr('href');

                        var referencedNode = jQuery(refNodeId, details);
                        var listNode = referencedNode.children('ul').first();
                        var imgNode = referencedNode.children('img').first();

                        var owningList = referencedNode.parent();
                        //if the node isn't currently visible we'll animate its expansion
                        if (owningList.is('ul') && !owningList.is(":visible") && listNode.length === 1) {
                            listNode.hide();
                            imgNode.attr('src', explanationParams.nodeExpandImage).attr('alt', explanationParams.nodeExpandAlt);
                        }

                        //make sure the node is visible
                        while (owningList.is('ul') && !owningList.is(":visible")) {
                            owningList.show();
                            owningList.parent().children('img').first().attr('src', explanationParams.nodeCollapseImage).attr('alt', explanationParams.nodeCollapseAlt);
                            owningList = owningList.parent().parent();
                        }

                        //go to it
                        jQuery('html, body').animate(
                            {scrollTop:referencedNode.offset().top},
                            1, "swing",
                            function () {
                                if (listNode.length === 1) {
                                    //auto expand node
                                    listNode.show('blind');
                                    imgNode.attr('src', explanationParams.nodeCollapseImage).attr('alt', explanationParams.nodeCollapseAlt);
                                }
                            });

                        //stop the link going into the browser history
                        event.preventDefault();
                    });
                }

            });
        }
    });
}

$( document ).ready(function() {
    initScreen();
});