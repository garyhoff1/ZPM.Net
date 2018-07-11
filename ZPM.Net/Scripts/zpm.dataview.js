// List View Class
/*
Copyright(c) 2018 Zpm Software Inc, ZpmSoftware.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// variables starting with $ are jquery selectors.
const INVALID_VALUE = "INVALID_VALUE";

if (typeof zpm === "undefined") {
    throw "zpm.dataview.js: zpm is not defined. zpm.js must be loaded first";
};

function ZpmDataView(viewId, modelTextName, getModelMethodName, focusOnChange, focusOnAdd) {
    var FindElement = function (selector) { // private function
        var e = $(selector);
        if (e.length == 0)
            throw "Element '" + selector + "' not found";
        return e;
    }
    zpm.FixedHeading($('.zpm-fixed-heading')); // create fixed heading elments before assigning this.$ListTbl
    zpm.FixedHeadingAlign($('.zpm-fixed-heading'));
    this.IsLoading = false;
    this.GetModelMethodName = getModelMethodName;
    this.$ViewId = FindElement('#' + viewId);
    this.$ListTbl = this.$ViewId.find(".zpm-dv-tbl");
    this.$Panel = this.$ViewId.find(".zpm-dv-panel");
    this.$DataPanel = this.$ViewId.find(".zpm-dv-data-panel");
    this.$FocusOnChange = this.$ViewId.find('#' + focusOnChange);
    this.$FocusOnAdd = this.$ViewId.find('#' + focusOnAdd);
    this.$DataPanelMessage = this.$DataPanel.find(".zpm-dv-control-panel-message");
    this.ModelTextName = modelTextName;
    this.$HideIfNoData = this.$ViewId.find('.zpm-dv-hide-if-no-data');
    this.IgnoreGotFocus = false; // don't call the lost focus function while this is true
    this.NewModel = null;  // when not null, in add mode. holds default values
    this.CurrentModel = null;  // model that is displayed if not null
    this.FilterText = "";
    //zpm.AppendDialog(); // div for popup dialog

    window.onbeforeunload = this.BeforeUnloadPage;
    this.$DataPanel.hide();
    this.$Panel[0].dataView = this; // for reference on callbacks
    this.DataFields = null; // this.GetDataFields("df");
    document.zpmDataView = this;
    document.title = modelTextName;
};

ZpmDataView.prototype.GetDataFields = function (classPrefix) {
    var allDataFields = this.$ViewId.find("." + classPrefix + "-get, ." + classPrefix + "-getset, ." + classPrefix + "-set");
    var dataFields = {};
    dataFields.ClassPrefix = classPrefix;
    dataFields.$KeyFields = this.$ViewId.find("." + classPrefix + "-key");
    dataFields.$SetDataFields = allDataFields.filter("." + classPrefix + "-set, ." + classPrefix + "-getset");
    dataFields.$GetDataFields = allDataFields.filter("." + classPrefix + "-get, ." + classPrefix + "-getset");
    var _this = this;
    allDataFields.each(function () {
        var $ctrl = $(this);
        _this.GetSetFunctionAssign($ctrl, classPrefix);
        if ($ctrl.hasClass(classPrefix + "-getset") || $ctrl.hasClass(classPrefix + "-get")) {
            if (this.onchange == null) // if not set
                this.onchange = function (e) { ZpmDataView.prototype.OnFieldChanged.call($(".zpm-dv-panel")[0].dataView,e, true); };
            if (this.oninput == null) // if not set
                this.oninput = function (e) { ZpmDataView.prototype.OnFieldChanged.call($(".zpm-dv-panel")[0].dataView, e, false); };
        }
    });
    return dataFields;
}

/* not used
ZpmDataView.prototype.ClearListTbl = function () {
    this.$HideIfNoData.hide();
    this.$ListTbl.find('tbody').html("");
    this.FilterText = null;
}
*/

ZpmDataView.prototype.KeyPress = function (e, event) {
    event.preventDefault();
    var key = (event.keyCode || event.which);
    if (event.ctrlKey) {

    } else if (event.altKey) {
    } else {  // normalkey
        if (this.$ListTbl[0].rows.length == 1)
            return; // empty, just heading row.

        var $tr = this.$SelectedRow();
        switch (key) {
            case 9: // tab
            case 13: // enter
                this.$FocusOnChange.focus();
                break;
            case 37: //left arrow
                break;
            case 39: // right arrow
                break;
            case 38: // up arrow
                do { $tr = $tr.prev(); } while ($tr.length == 1 && $tr[0].rowIndex>0 && !$tr.is(':visible'));
                if ($tr.length == 1 && $tr[0].rowIndex > 0)
                    this.SelectRow($tr, true);
                break;
            case 40: // down arrow
                do { $tr = $tr.next(); } while ($tr.length == 1 && !$tr.is(':visible'));
                if ($tr.length == 1)
                    this.SelectRow($tr, true);
                break;
            case 36: // home
                var $tr = $(this.$ListTbl[0].rows[1]); // skip heading row
                while ($tr.length==1 && !$tr.is(':visible')) //find first visible row
                    $tr = $tr.next();
                this.SelectRow($tr, true);
                break;
            case 35: // end
                var $tr = $(this.$ListTbl[0].rows[this.$ListTbl[0].rows.length-1]); // last row
                while (!$tr.is(':visible')) //find last visible row
                    $tr = $tr.prev();
                this.SelectRow($tr, true);
                break;
            case 33: // page up
                this.$ListTbl.scrollTop(Math.max(0, this.$ListTbl.scrollTop() - this.$ListTbl[0].clientHeight));
                var top = this.$ListTbl.scrollTop() + this.$ListTbl[0].offsetTop;
                var $newTr = $tr;
                while ($tr.length == 1) {
                    if ($tr.is(':visible')) {
                        if ($tr[0].offsetTop < top)
                            break;
                        $newTr = $tr;
                    }
                    $tr = $tr.prev();
                }
                this.SelectRow($newTr, true);
                break;
            case 34: // page down
                this.$ListTbl.scrollTop(this.$ListTbl.scrollTop() + this.$ListTbl[0].clientHeight);
                var bottom = this.$ListTbl.scrollTop() + this.$ListTbl[0].clientHeight + this.$ListTbl[0].offsetTop;
                var $newTr = $tr;
                while ($tr.length == 1) {
                    if ($tr.is(':visible')) {
                        if ($tr[0].offsetTop + $tr.height() > bottom)
                            break;
                        $newTr = $tr;
                    }
                    $tr = $tr.next();
                }
                this.SelectRow($newTr, true);
                break;
        }

    }
};


// used when user clicks on a row.
// returns id of row clicked on
ZpmDataView.prototype.RowClicked = function (tr) {
     if (this.$ListTbl.hasClass("zpm-dv-disabled"))
        return 0; // can't click when in add mode'

    var rowId = this.GetRowID(tr); // could be string or number returned
    if (typeof rowId == "string") {
        if (rowId == "")
            return ""; // not a valid row id
    } else if (rowId <= 0)
        return 0; // not a valid row id
    if (this.BindExistingModel(rowId)) // if change is allowed
        this.MarkRowSelected(tr);
    return rowId;
};

var selCnt = 0;

ZpmDataView.prototype.SelectRow = function ($tr, checkActiveAjax) {
    if ((!(checkActiveAjax === undefined) && !checkActiveAjax) || $.active == 0) {  // no ajax calls active)
        $($tr[0].cells[0]).focus();
        if ($tr != null && $tr.length == 1) {
            var $current = this.$SelectedRow();
            if ($current.length == 0 || $current[0].rowIndex != $tr[0].rowIndex) {
                this.RowClicked($tr[0]);
                //setTimeout(zpm.ScrollIntoView, 50, $tr, this.$ListTbl);
                zpm.ScrollIntoView($tr, this.$ListTbl);
            }
        }
    }
}

ZpmDataView.prototype.$SelectedRow = function () {
    return this.$ListTbl.find('.selected-row');
};

ZpmDataView.prototype.MarkRowSelected = function (tr) {
    this.$ListTbl.find('.selected-row').removeClass('selected-row'); // clear previous selected
    if (tr != null)
        $(tr).attr("class", "selected-row");  // set current selection
};

ZpmDataView.prototype.BeforeUnloadPage = function (e) {
    var $changed = $(".zpm-field-changed");
    if ($changed.length > 0) {
        var _this = $(".zpm-dv-panel")[0].dataView;
        return "Changes to the current " + _this.ModelTextName + " have not been saved.";
    }
};

ZpmDataView.prototype.IfChanged = function (message) {
    // return true if any data fields have been changed
    var $changed = this.$ViewId.find(".zpm-field-changed");
    if ($changed.length > 0) {
        if (!(message === undefined))
            this.Alert("Data has been changed.\nSave or Cancel before\n" + message + ".");
        return true;
    }
    return false;
};

ZpmDataView.prototype.ClearChanged = function ($section) {
    var $changed = $section.find(".zpm-field-changed");
    $changed.removeClass("zpm-field-changed");
};

ZpmDataView.prototype.GetRowID = function (tr) {
    if (tr.id == "")
        return $(tr.cells[0]).text();  // if no id, assume key in the first cell
    return parseInt(tr.id.substring(2)); // format is ID1234
};

ZpmDataView.prototype.BindExistingModel = function (id) {
    if (this.IfChanged("selecting another " + this.ModelTextName))
        return false; // can't move to new model, until it's been saved or canceled

    var ActiveDataView = this;
    this.IsLoading = true;

    this.AjaxPost(this.GetModelMethodName, { id: id },
        function (model) {
            if (model == null) {
                ActiveDataView.Alert("Action " + ActiveDataView.GetModelMethodName + " failed");
            } else {
                ActiveDataView.BindModelToForm(model, null);
            }
        },
        function (err) {
            zpm.ErrorDialog(err.responseText, 800, 1000);
        });

    return true;
};

ZpmDataView.prototype.AjaxPost = function (methodUrl, data, fnSuccess, fnError) {
    zpm.AjaxCallbackTimer(methodUrl);
    $.ajax({ url: methodUrl, type: "POST", data: data, success: fnSuccess, error: fnError });
}

// for existing models
ZpmDataView.prototype.BindModelToForm = function (model, saveResult) {
    this.IsLoading = false;
    if (model == null) {
        this.Alert(this.GetModelMethodName + " failed: model is invalid");
        return;
    }
    this.NewModel = null;  // not new
    this.CurrentModel = model; // save for restore if cancel
    this.BindDataToFields(model, saveResult);
    this.DataFields.$KeyFields.prop('disabled', true);
    this.BindDataToFieldsExtend(model, saveResult);
    this.ActivateButtons(false, false, true);
    this.$DataPanel.show();
    //this.$FocusOnChange.focus();
};

ZpmDataView.prototype.BindDataToFieldsExtend = function (model, saveResult) {
    // hook for customization. Display additional data after displaying existing model data.
}

ZpmDataView.prototype.BindDataToFields = function (model, saveResult) {
    if (this.DataFields == null)
        this.DataFields = this.GetDataFields("df");
    this.ClearChanged(this.$ViewId);
    this.$DataPanel.find('.zpm-dv-error').removeClass('zpm-dv-error');
    this.$HideIfNoData.show();
    this.Message("");
    this.SetDataFields(model, this.DataFields.$SetDataFields, "")
};

ZpmDataView.prototype.SetDataFields = function (model, $dataFields, idPrefix) {
    var dv = this;
    $dataFields.each(function () {
        var $ctrl = $(this);
        var dataName = dv.DataName($ctrl, idPrefix);
        var value = model[dataName];
        if (!(value === undefined)) { // matching field found
            try { // call member methods by type name
                value = zpm.BlankIfNull(value);
                this.DataView_SetData(value);
                $ctrl.attr("data-initial-value", value.toString());
            }
            catch (ex) { // display message, cancel save
                if (ex.name == INVALID_VALUE) {
                    if ($ctrl.is(":visible")) {
                        dv.Message(ex.message);
                        $ctrl.addClass('zpm-dv-error');
                        $ctrl.focus();
                        return;
                    }
                    dv.Alert("Hidden field '" + dataName + "' has invalid value: " + ex.message);
                    return;
                }
                dv.Alert("ZpmDataView Error: " + ex.message);
                return;
            }
        }
    });
}

ZpmDataView.prototype.GetSetFunctionAssign = function ($ctrl, classPrefix) {
    var getset = ($ctrl.hasClass(classPrefix + "-getset") || $ctrl.hasClass(classPrefix + "-get"));
    var dataType = $ctrl.attr("data-type");
    if (dataType === undefined)
        dataType = "string";

    switch (dataType) {
        case "string":
            switch ($ctrl[0].nodeName) {
                case 'INPUT':
                case 'SELECT':
                case 'TEXTAREA':
                    $ctrl[0].DataView_SetData = this.Set_StringUsingVal;
                    if (getset)
                        $ctrl[0].DataView_GetData = this.Get_StringUsingVal;
                    break;
                default:
                    $ctrl[0].DataView_SetData = this.Set_StringUsingText;
                    if (getset)
                        $ctrl[0].DataView_GetData = this.Get_StringUsingText;
                    break;
            }
            break;

        case "integer":
            switch ($ctrl[0].nodeName) {
                case 'INPUT':
                case 'SELECT':
                case 'TEXTAREA':
                    $ctrl[0].DataView_SetData = this.Set_IntegerUsingVal;
                    if (getset)
                        $ctrl[0].DataView_GetData = this.Get_IntegerUsingVal;
                    break;
                default:
                    $ctrl[0].DataView_SetData = this.Set_IntegerUsingText;
                    if (getset)
                        $ctrl[0].DataView_GetData = this.Get_IntegerUsingText;
                    break;
            }
            break;
        case "integer-array":
            switch ($ctrl[0].nodeName) {
                case 'SELECT':
                    $ctrl[0].DataView_SetData = this.Set_IntegerArrayUsingVal;
                    if (getset)
                        $ctrl[0].DataView_GetData = this.Get_IntegerArrayUsingVal;
                    break;
                default:
                    throw "invalid nodeName '" + $ctrl[0].nodeName + "' for data type integer-array on control id '" + $ctrl[0].id + "'";
            }
            break;

        case "date":
            switch ($ctrl[0].nodeName) {
                case 'INPUT':
                    $ctrl.datepicker(zpm.DatePickerOptions);
                    $ctrl[0].DataView_SetData = this.Set_DateUsingVal;
                    if (getset)
                        $ctrl[0].DataView_GetData = this.Get_DateUsingVal;
                    break;
                default:
                    $ctrl[0].DataView_SetData = this.Set_DateUsingText;
                    if (getset)
                        $ctrl[0].DataView_GetData = this.Get_DateUsingText;
                    break;
            }
            break;
        case "number":
            var decimals = $ctrl.attr("data-decimals");
            if (!(decimals === undefined))
                $ctrl[0].DataDecimals = parseInt(decimals);

            switch ($ctrl[0].nodeName) {
                case 'INPUT':
                case 'SELECT':
                case 'TEXTAREA':
                    $ctrl[0].DataView_SetData = this.Set_NumberUsingVal;
                    if (getset)
                        $ctrl[0].DataView_GetData = this.Get_NumberUsingVal;
                    break;
                default:
                    $ctrl[0].DataView_SetData = this.Set_NumberUsingText;
                    if (getset)
                        $ctrl[0].DataView_GetData = this.Get_NumberUsingText;
                    break;
            }
            break;
        case "bool": // checkbox
            if ($ctrl[0].nodeName == 'INPUT' && $ctrl.prop('type') == 'checkbox') {
                $ctrl[0].DataView_SetData = this.Set_Bool;
                if (getset)
                    $ctrl[0].DataView_GetData = this.Get_Bool;
            } else {
                throw "invalid nodeName '" + $ctrl[0].nodeName + "' for data type bool on control id '" + $ctrl[0].id + "'";
            }
            break;

        default: // hook for custom data types
            this.GetSetCustomFunctionAssign($ctrl, dataType, getset);
    }
}

ZpmDataView.prototype.GetSetCustomFunctionAssign = function ($ctrl, dataType, getset) {
    throw "invalid data type: " + dataType + " on control id '" + $ctrl[0].id + "'";
};

// ===== data Set methods =======================
ZpmDataView.prototype.Set_StringUsingVal = function (value) {
    $(this).val(zpm.BlankIfNull(value));
};

ZpmDataView.prototype.Set_StringUsingText = function (value) {
    $(this).text(zpm.BlankIfNull(value));
};

ZpmDataView.prototype.Set_IntegerUsingVal = function (value) {
    $(this).val((value == 0) ? "" : value.toString());
};

ZpmDataView.prototype.Set_IntegerUsingText = function (value) {
    $(this).text((value == 0) ? "" : value.toString());
};

ZpmDataView.prototype.Set_IntegerArrayUsingVal = function (value) {
    $(this).val(value).trigger('chosen:updated');
};

ZpmDataView.prototype.Set_NumberUsingVal = function (value) {
    $(this).val(zpm.FormatNumber(value, this.DataDecimals));
};

ZpmDataView.prototype.Set_NumberUsingText = function (value) {
    $(this).text(zpm.FormatNumber(value, this.DataDecimals));
};

ZpmDataView.prototype.Set_DateUsingVal = function (value) {
    $(this).val(zpm.FormatDate(value));
};

ZpmDataView.prototype.Set_DateUsingText = function (value) {
    $(this).text(zpm.FormatDate(value));
};

ZpmDataView.prototype.Set_Bool = function (value) {
    this.checked = value;
};

// ===== data Get methods =======================
ZpmDataView.prototype.Get_StringUsingVal = function (onBlur) {
    return $(this).val().trim();
};

ZpmDataView.prototype.Get_StringUsingText = function (onBlur) {
    return $(this).text().trim();
};

ZpmDataView.prototype.Get_IntegerUsingVal = function (onBlur) {
    var value = $(this).val().trim();
    if (value == "")
        return 0;
    if (!zpm.IsNumeric(value))
        throw { name: INVALID_VALUE, message: "Invalid numeric value" };
    return zpm.GetInteger(value);
};

ZpmDataView.prototype.Get_IntegerUsingText = function (onBlur) {
    var value = $(this).text().trim();
    if (value == "")
        return 0;
    if (!zpm.IsNumeric(value))
        throw { name: INVALID_VALUE, message: "Invalid numeric value" };
    return zpm.GetInteger(value);
};

ZpmDataView.prototype.Get_IntegerArrayUsingVal = function (onBlur) {
    var array = $(this).val();
    if (array == null)
        return [];
    return zpm.StringArrayToInt(array);
};

ZpmDataView.prototype.Get_NumberUsingVal = function (onBlur) {
    var value = $(this).val().trim();
    if (value == "")
        return 0;
    if (!zpm.IsNumeric(value))
        throw { name: INVALID_VALUE, message: "Invalid numeric value" };

    var num = zpm.GetNumber(value, this.DataDecimals);
    if (onBlur) // redisplay on focus lost
        $(this).val(zpm.FormatNumber(num, this.DataDecimals));
    return num;
};

ZpmDataView.prototype.Get_NumberUsingText = function (onBlur) {
    var value = $(this).text().trim();
    if (value == "")
        return 0;
    if (!zpm.IsNumeric(value))
        throw { name: INVALID_VALUE, message: "Invalid numeric value" };
    return zpm.GetNumber(value, this.DataDecimals);
};

ZpmDataView.prototype.Get_DateUsingVal = function (onBlur) {
    var dateText = $(this).val().trim();
    if (dateText == '')
        return null;

    var d;
    try {
        d = $.datepicker.parseDate('mm/dd/yy', dateText);
    }
    catch (ex) {
        if (onBlur)
            throw { name: INVALID_VALUE, message: "Invalid date" };
        return null;
    }
    return d;
};

ZpmDataView.prototype.Get_DateUsingText = function (onBlur) {
    return new Date($(this).text());
};

ZpmDataView.prototype.Get_Bool = function (onBlur) {
    return this.checked;
};

ZpmDataView.prototype.Add = function (addMethodName) {
    var ActiveDataView = this; // save context
    zpm.AjaxCallbackTimer(addMethodName);
    $.ajax({
        url: addMethodName,
        type: "POST",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function (model) {
            if (model == null) {
                ActiveDataView.Alert("Action " + addMethodName + " failed");
            } else {
                ActiveDataView.PostAdd(model);
            }
        },
        error: function (err) {
            zpm.ErrorDialog(err.responseText, 800, 1000);
        }
    });
};

ZpmDataView.prototype.PostAdd = function (model) {
    //this.MarkRowSelected(null);
    this.$ListTbl.addClass("zpm-dv-disabled");
    this.NewModel = model;  // not new
    this.BindDataToFields(model, null);
    this.DataFields.$KeyFields.prop('disabled', false);
    this.PostAddExtend(model);
    this.ActivateButtons(false, true, false);
    this.$DataPanel.show();
    this.$FocusOnAdd.focus();
};

ZpmDataView.prototype.PostAddExtend = function (model) {
    // hook for customization. Display additional data after displaying model data.
}

ZpmDataView.prototype.DataType = function ($ctrl) {
    var dataType = $ctrl.attr('data-type');
    if (dataType === undefined)
        return "string";
    return dataType;
};

ZpmDataView.prototype.DataName = function ($ctrl, idPrefix) {
    var dataName = $ctrl.attr('data-name');
    if (!(dataName === undefined))
        return dataName;
    if (idPrefix == "" || $ctrl[0].id.indexOf(idPrefix)!=0)
        return $ctrl[0].id; // use id if data-name not provided.
    return $ctrl[0].id.substring(idPrefix.length); // remove prefix
};

ZpmDataView.prototype.GetData = function (dataFields, idPrefix) {
    var myData = {};
    for (var x = 0; x < dataFields.$GetDataFields.length; x++) {
        var $ctrl = $(dataFields.$GetDataFields[x]);
        var dataType = this.DataType($ctrl);
        var dataName = this.DataName($ctrl, idPrefix);
        try { // call member methods for data type
            myData[dataName] = $ctrl[0].DataView_GetData();
        }
        catch (ex) { // display message, cancel save
            if (ex.name == INVALID_VALUE) {
                if ($ctrl.is(":visible")) {
                    this.Message(ex.message);
                    $ctrl.addClass('zpm-dv-error');
                    $ctrl.focus();
                    return null;
                }
                this.Alert("Hidden field '" + dataName + "' has invalid value: " + ex.message);
                return null;
            }
            this.Alert("ZpmDataView Error: " + ex.message);
            return null;
        }
    }
    return myData;
}

ZpmDataView.prototype.Save = function (saveMethodName) {
    var myData = this.GetData(this.DataFields,"");
    if (myData != null) {
        var ActiveDataView = this; // save context
        zpm.AjaxCallbackTimer(saveMethodName);
        this.Message("");
        $.ajax({
            url: saveMethodName,
            type: "POST",
            data: JSON.stringify(myData),
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            success: function (saveResult) {
                if (saveResult == null) {
                    ActiveDataView.Alert("Action " + saveMethodName + " failed");
                } else {
                    ActiveDataView.PostSave(saveResult);
                }
            },
            error: function (err) {
                zpm.ErrorDialog(err.responseText, 800, 1000);
            }
        });
    }
};

ZpmDataView.prototype.PostSave = function (saveResult) {
    if (saveResult.Model != null) {
        this.ClearChanged(this.$ViewId);
        if (this.NewModel != null) {
            this.$ListTbl.removeClass("zpm-dv-disabled");
        }
        this.ListUpdate(saveResult.Model);
        this.BindModelToForm(saveResult.Model, saveResult);
    }
    var errorHtml = "";
    var warningHtml = "";
    var messageHtml = "";
    for (var x = 0; x < saveResult.Messages.length; x++) {
        var m = saveResult.Messages[x];
        switch (m.Delivery) {
            case 1: // SaveMessageDelivery.Popup
                this.Alert(this.SaveMessageText(m));
                break;
            default: // MessageLine
                switch (m.Type) {
                    case 1: // SaveMessageType.Warning
                        warningHtml += this.SaveMessageText(m) + "<br />";
                        break;
                    case 2: // SaveMessageType.Error
                        errorHtml += this.SaveMessageText(m) + "<br />";
                        break;
                    default: // SaveMessageType.Normal
                        messageHtml += this.SaveMessageText(m) + "<br />";
                        break;
                }
                break;
        }
        if (m.FocusControl != "") {
            $('#' + m.FocusControl).addClass('zpm-dv-error').focus();
        }
    }
    this.$DataPanelMessage.html(errorHtml + warningHtml + messageHtml);
};

ZpmDataView.prototype.SaveMessageText = function (message) {
    switch (message.Type) {
        case 1: return "Warning: " + message.Message;  // SaveMessageType.Warning
        case 2: return "Error: " + message.Message;  // SaveMessageType.Error
        default: return message.Message;  // SaveMessageType.Normal
    }
};

ZpmDataView.prototype.ListRowHtml = function (model) {
    throw "ListRowHtml is not defined."; // must be customized by caller for each list
}

ZpmDataView.prototype.ListUpdate = function (model) {
    if (this.NewModel == null) {
        var $tr = this.$SelectedRow(); // esisting row
        var rowIndex = $tr[0].rowIndex;
        var beforeText = $tr.find('td').text();
        $tr[0].outerHTML = this.ListRowHtml(model);
        var tr = this.$ListTbl[0].rows[rowIndex]; // get changed row
        this.MarkRowSelected(tr);
        var afterText = $(tr).find('td').text();
        if (beforeText != afterText)
            zpm.TableReSort(this.$ListTbl); // need to resort list
        zpm.ScrollIntoView($(tr), this.$ListTbl);
    } else {  // new row
        this.$ListTbl.append(this.ListRowHtml(model));
        var tr = this.$ListTbl[0].rows[this.$ListTbl[0].rows.length - 1]; // get new row
        this.MarkRowSelected(tr);
        zpm.TableReSort(this.$ListTbl);
        zpm.ScrollIntoView($(tr), this.$ListTbl);
    }
};

ZpmDataView.prototype.Cancel = function () {
    this.$DataPanel.find('.zpm-dv-error').removeClass('zpm-dv-error');
    this.Message("");
    this.$ListTbl.removeClass("zpm-dv-disabled");
    if (this.CurrentModel == null) {
        this.$DataPanel.hide();
        this.ClearChanged(this.$ViewId);
    } else {
        this.BindModelToForm(this.CurrentModel);
    }
};

ZpmDataView.prototype.RowText = function ($tr) {
    var trDesc = "";
    $tr.find('td').each(function () { trDesc += " " + this.textContent; });
    return trDesc;
};

ZpmDataView.prototype.Delete = function (deleteMethodName) {
    $tr = this.$SelectedRow();
    var id = this.GetRowID($tr[0]);
    if ((typeof id == "string" && id == "") || id == 0) // ignore if blank or zero.
        return;

    if (!this.Confirm("Delete " + this.ModelTextName + this.RowText($tr) + "?"))
        return;

    var ActiveDataView = this; // save context
    zpm.AjaxCallbackTimer(deleteMethodName);
    $.ajax({
        url: deleteMethodName,
        type: "POST",
        data: JSON.stringify({ id: id }),
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function (result) {
            if (result == null) {
                ActiveDataView.Alert("Action " + deleteMethodName + " failed");
            } else if (result != "") {
                ActiveDataView.Alert(result);
            } else {
                ActiveDataView.PostDelete(result);
            }
        },
        error: function (err) {
            zpm.ErrorDialog(err.responseText, 800, 1000);
        }
    });
};

ZpmDataView.prototype.PostDelete = function (result) {
    $tr = this.$SelectedRow();
    $trPrev = $tr.prev();
    $trNext = $tr.next();
    $tr.remove();
    if ($trNext.length == 1)
        this.SelectRow($trNext, false);
    else if ($trPrev.length == 1)
        this.SelectRow($trPrev, false); // use previous if no next.
    else
        this.$DataPanel.hide(); // nothing to show
};

ZpmDataView.prototype.Message = function (message) {
    this.$DataPanelMessage.text(message);
};

ZpmDataView.prototype.OnFieldChanged = function (e, onBlur) {
    var $fld = $(e.currentTarget || e.target);
    var $highlightFld = ($fld.hasClass('chosen-select') || $fld.is(":checkbox")) ? $fld.parent() : $fld; // can't change background on checkbox, use parent

    var changedCount = this.$ViewId.find(".zpm-field-changed").length;
    var initialValue = $fld.attr("data-initial-value");
    var hasFieldChanged = $highlightFld.hasClass("zpm-field-changed");
    try {
        if (initialValue == zpm.BlankIfNull($fld[0].DataView_GetData(onBlur)).toString()) {
            if (hasFieldChanged) {
                $highlightFld.removeClass('zpm-field-changed');
                if (changedCount == 1) // would be zero now, no changes
                    this.ActivateButtons(false, this.NewModel != null, false);
            }
        } else {
            if (!hasFieldChanged) {
                $highlightFld.addClass('zpm-field-changed');
                if (changedCount == 0) //  has changes now
                    this.ActivateButtons(true, true, this.NewModel == null);
            }
        }
        if ($fld.hasClass('zpm-dv-error')) {
            $fld.removeClass('zpm-dv-error');
            this.Message("");
        }
    }
    catch (ex) { // display message, cancel save
        if (ex.name == INVALID_VALUE) {
            if ($fld.is(":visible")) {
                this.Message(ex.message);
                $fld.addClass('zpm-dv-error');
                $fld.focus();
                return;
            }
            this.Alert("Hidden field '" + $fld[0].id + "' has invalid value: " + ex.message);
            return;
        }
        this.Alert("ZpmDataView Error: " + ex.message);
        return;
    }
};

ZpmDataView.prototype.ActivateButtons = function (saveFlag, cancelFlag, deleteFlag) {
    this.$Panel.find('.zpm-dv-control-panel-save').prop('disabled', !saveFlag);
    this.$Panel.find('.zpm-dv-control-panel-cancel').prop('disabled', !cancelFlag);
    this.$Panel.find('.zpm-dv-control-panel-delete').prop('disabled', !deleteFlag);
};

ZpmDataView.prototype.Alert = function (message) {
    this.IgnoreGotFocus = true;
    alert((message.length > 2500) ? message.substring(0, 2500) : message);
    this.IgnoreGotFocus = false;
};

ZpmDataView.prototype.Confirm = function (message) {
    this.IgnoreGotFocus = true;
    var ret = confirm((message.length > 2500) ? message.substring(0, 2500) : message);
    this.IgnoreGotFocus = false;
    return ret;
};

ZpmDataView.prototype.FilterKeyUp = function (e) {
    setTimeout(function () { ZpmDataView.prototype.FilterList.call($(".zpm-dv-panel")[0].dataView, e) }, 200);
}

ZpmDataView.prototype.FilterList = function(e) {
    var filterText = $(e).val().trim().toUpperCase();
    if (this.FilterText != filterText) { // if changed
        this.FilterText = filterText;
        if (filterText == "") {
            this.FilterClear();
        } else {
            var rows = this.$ListTbl[0].rows;
            for (var r = 1; r < rows.length; r++) {
                var row = $(rows[r]);
                if (row.text().toUpperCase().indexOf(filterText) >= 0)
                    row.show();
                else
                    row.hide();
            }
            zpm.FixedHeadingAlign($('.zpm-fixed-heading'));
        }
    }
}

ZpmDataView.prototype.FilterClear = function () {
    $('.zpm-dv-filter').val(""); // clear filter, show all rows
    var rows = this.$ListTbl[0].rows;
    for (var r = 1; r < rows.length; r++)
        $(rows[r]).show();
}