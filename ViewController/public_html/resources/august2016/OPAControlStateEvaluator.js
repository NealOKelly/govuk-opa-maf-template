var OPAControlStateEvaluator = OPAControlStateEvaluator || {};

OPAControlStateEvaluator.ControlStateRule = function (controlId, hideIfExpr, readOnlyIfExpr, optionalIfExpr, defaultState) {
    this.controlId = controlId;
    this.hideIfExpr = hideIfExpr;
    this.readOnlyIfExpr = readOnlyIfExpr;
    this.optionalIfExpr = optionalIfExpr;
    this.defaultState = defaultState;
    this.evaluate = function () {
        var state = this.defaultState;
        if (this.hideIfExpr.evaluate()) {
            state = "hidden";
        } else if (this.readOnlyIfExpr.evaluate()) {
            state = "readonly";
        } else if (this.optionalIfExpr.evaluate()) {
            state = "optional";
        }

        return state;
    };
}

OPAControlStateEvaluator.ConstantExpression = function (val) {
    this.val = val;
    this.evaluate = function () {
        return this.val;
    }
}

OPAControlStateEvaluator.DynamicExpression = function (valControlId, exprType, exprOp, exprVals) {
    this.controlId = valControlId;
    this.exprType = exprType;
    this.exprOp = exprOp
    this.exprVals = exprVals;
    this.evaluate = function () {
        var ctrlVal = this.ctrl.state !== "hidden" && this.ctrl.state !== "readonly" ? this.ctrl.value : null;
        var result;

        if(this.exprOp === "=="){
            result = ctrlVal === this.exprVals[0];
        } else if(this.exprOp === "!="){
            result = ctrlVal !== this.exprVals[0];
        } else {
            var found = false;
            for(var i = 0; i < this.exprVals.length; ++i){
                if(ctrlVal === this.exprVals[i]){
                    found = true;
                    break;
                }
            }

           result = this.exprOp === "In" ? found : !found;
        }

        return this.exprType == "If" ? result : !result;
    }
}

OPAControlStateEvaluator.Control = function (id, state, value) {
    this.id = id;
    this.value = value || null;
    this.state = state;
}

OPAControlStateEvaluator.Engine = function (rules, controls) {
    this.controls = controls;
    this.rules = rules;
    this.controlsById = {};
    this.onStateChange = undefined;

    this.evaluate = function () {
        var maxLoops = 20;
        var loopCounter = 0;
        var anyChange = false;
        var changedCtrls = {};

        while (loopCounter < maxLoops) {
            var change = false;

            for (var i = 0; i < rules.length; ++i) {
                var rule = rules[i];
                var cond = rule.evaluate();
                var ctrl = rule.ctrl;
                if (ctrl.state != cond) {
                    ctrl.state = cond;
                    change = true;
                    anyChange = true;
                    changedCtrls[ctrl.id] = ctrl;
                }
            }

            if (!change)
                break;

            ++loopCounter;
        }

        if (this.onStateChange && anyChange) {
            var controls = [];
            for (var key in changedCtrls)
                controls.push(changedCtrls[key]);

            this.onStateChange(controls)
        }

    }

    this.setControlValue = function (controlId, value) {
        this.controlsById[controlId].value = value;
    }

    for (var i = 0; i < controls.length; ++i) {
        var ctrl = controls[i];
        this.controlsById[ctrl.id] = ctrl;
    }

    for (var i = 0; i < rules.length; ++i) {
        var rule = rules[i];
        rule.ctrl = this.controlsById[rule.controlId];

        if (rule.hideIfExpr instanceof OPAControlStateEvaluator.DynamicExpression) {
            rule.hideIfExpr.ctrl = this.controlsById[rule.hideIfExpr.controlId];
        }

        if (rule.readOnlyIfExpr instanceof OPAControlStateEvaluator.DynamicExpression) {
            rule.readOnlyIfExpr.ctrl = this.controlsById[rule.readOnlyIfExpr.controlId];
        }

        if (rule.optionalIfExpr instanceof OPAControlStateEvaluator.DynamicExpression) {
            rule.optionalIfExpr.ctrl = this.controlsById[rule.optionalIfExpr.controlId];
        }
    }
}

