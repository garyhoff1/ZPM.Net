/*
Copyright(c) 2018 Zpm Software Inc, ZpmSoftware.com

The Code Project Open License (CPOL) governs Your use of ZPM.Net.
This License is intended to allow developers to use the Source Code
and Executable Files provided as part of the Work in any application in any form.

The full agremeent is available at: https://www.codeproject.com/info/cpol10.aspx
*/
var zpm = new Zpm();

function Zpm() {
}

Zpm.prototype.DatePickerOptions = { dateFormat: "mm/dd/yy", onSelect: this.DatePickerOnSelect, showOtherMonths: true, selectOtherMonths: true, beforeShow: this.DatePickerBeforeShow };

Zpm.prototype.ErrorDialog = function (htmlMessage, height, width) {
    var $dialog = $("#zpm-dialog");
    if ($dialog.length == 0) {
        Zpm.prototype.AppendDialog(); // div for popup dialog
        $dialog = $("#zpm-dialog");
    }
    $dialog.dialog("option", "width", width).dialog("option", "height", height);
    $dialog.html(htmlMessage);
    $dialog.dialog("open");
};

Zpm.prototype.AppendDialog = function () {
    if ($('#zpm-dialog').length == 0) { // prevent duplicates
        $('body').append('<div id="zpm-dialog" title="Dialog Form"></div>')

        $("#zpm-dialog").dialog({
            autoOpen: false, modal: true, show: 200, hide: 100
        });
    }
};

Zpm.prototype.FormatNumber = function (num, decimals) {
    if (num == null || num == 0)
        return "";
    if (decimals === undefined)
        return num.toString(); // floating point
    return num.toFixed(decimals);
}

Zpm.prototype.GetInteger = function (i) { // assumes IsNumeric is true
    if (i == null || i == '') return 0;
    if (isNaN(i)) return null;
    return parseInt(i);  // integer
};

Zpm.prototype.GetNumber = function (n, decimals) { // assumes IsNumeric is true
    if (n == null || n == '') return 0;
    if (isNaN(n)) return null;
    num = parseFloat(n);  // numeric
    if ( (decimals === undefined))
        return num; // floating dec point
    return Math.round((num * Math.pow(10, decimals))) / Math.pow(10, decimals);
};

Zpm.prototype.StringArrayToInt = function (strArray) { // assumes strArray has valid numeric strings (like values from chosen)
    var result = [];
    for (var i = 0; i < strArray.length; i++)
        result.push(parseInt(strArray[i]));
    return result;  // integer array
};

// ---------------------------------------------------------------------
// ----------------- FixedHeading --------------------------------------
// ---------------------------------------------------------------------
Zpm.prototype.FixedHeading = function ($tbl) {
    var tblId = $tbl.uniqueId()[0].id;
    var tblHtml = $tbl[0].outerHTML;
    $tbl[0].outerHTML = "<div class='zpm-fixed-heading-container'>" +
        "    <div class='zpm-fixed-heading-div' style='width:100%; height:21px;'><div style='position:relative;'></div></div>" +
        tblHtml + "</div>";
    $tbl = $('#' + tblId); // get new element
    var $th = $tbl.find('thead th');
    $th.each(function () {
        var html = this.innerHTML.trim().replace('\n', '').replace('\r', '');
        if (html.indexOf('<div') != 0)
            this.innerHTML = "<div>" + html + "</div>";
    });
    var $container = $tbl.parent();
    var $headingDiv = $container.find('.zpm-fixed-heading-div');
    var $headingDivDiv = $headingDiv.find('div');
    this.MoveCss('margin-top', '0px', $tbl, $container);
    this.CopyCss('background-color', $($th[0]), $headingDivDiv);
    this.MoveCss('background-color', '', $($th[0]), $headingDiv);
    if (this.CopyCss('border-top-width', $tbl, $headingDiv)) {
        this.CopyCss('border-top-color', $tbl, $headingDiv);
        this.CopyCss('border-top-style', $tbl, $headingDiv);
    }
    if (this.CopyCss('border-left-width', $tbl, $headingDiv)) {
        this.CopyCss('border-left-color', $tbl, $headingDiv);
        this.CopyCss('border-left-style', $tbl, $headingDiv);
    }
    if (this.CopyCss('border-right-width', $tbl, $headingDiv)) {
        this.CopyCss('border-right-color', $tbl, $headingDiv);
        this.CopyCss('border-right-style', $tbl, $headingDiv);
    }

    this.FixedHeadingAlign($tbl);
    $tbl.on('scroll', this.FixedHeadingScroll);
}

Zpm.prototype.FixedHeadingAlign = function ($tbl) { // call this whenever the table changes
    var $th = $tbl.find("thead th");
    var maxHeight = 0;
    $th.each(function () {
        $div = $(this).find('div');
        $div.css('width', ''); // clear prev value
        $(this).css("min-width", ($div.width() + 10) + 'px');
        maxHeight = Math.max(maxHeight, $div.height());
    }); // resize th to match heading text

    var $hdiv = $tbl.parent().find('.zpm-fixed-heading-div');
    var borderWidth = parseInt($hdiv.css('border-left-width').replace('px', '')) + parseInt($hdiv.css('border-right-width').replace('px', ''));
    var padding = parseInt($th.css('padding-top').replace('px', '')) + parseInt($th.css('padding-bottom').replace('px', ''));
    maxHeight = Math.round(maxHeight);
    $hdiv.css('height', (maxHeight + 1) + 'px').css('width', ($tbl[0].offsetWidth - borderWidth) + 'px'); // adjust heading div to match table
    $hdiv.find('div').css('height', (maxHeight + padding + 2) + 'px');
    $tbl.data("lastScrollLeft", -1); // initialize for table scroll
    $th.each(function (idx) {
        var $div = $(this).find('div');
        $div.css('margin-top', (-maxHeight) + 'px').css('padding-top', (maxHeight - $div.height()) / 2 + 'px').css('width', $(this).width() + 'px');
    });
    this.FixedHeadingScroll({ target: $tbl[0] });
}

Zpm.prototype.FixedHeadingAlign_old = function ($tbl) { // call this whenever the table changes
    var $th = $tbl.find("thead th");
    var $div = $th.find('div');
    var maxHeight = 0;

    for (var x = 0; x < $th.length; x++) {
        if ($($div[x]).css('overflow') != "hidden") { // if not specified, needs initialization
            $($div[x]).css('overflow', 'hidden');
            if ($($th[x]).css('minWidth') == "0px") {
                $($div[x]).css('width', '1px');
                $($th[x]).css('minWidth', $div[x].scrollWidth + 3);
            }
        }
        $($div[x]).css('maxWidth', $($th[x]).width() + 'px').css('width', $($th[x]).width() + 'px');
    }

    $div.each(function () {
        $(this).height('auto'); // recalc height
        maxHeight = Math.max(maxHeight, $(this).height());  // $div.height()
    });
    maxHeight = Math.ceil(maxHeight);
    var $hdiv = $tbl.parent().find('.zpm-fixed-heading-div');
    var borderWidth = parseInt($hdiv.css('border-left-width').replace('px', '')) + parseInt($hdiv.css('border-right-width').replace('px', ''));
    var padding = parseInt($th.css('padding-top').replace('px', '')) + parseInt($th.css('padding-bottom').replace('px', ''));
    $hdiv.css('height', (maxHeight + 1) + 'px').css('width', ($tbl[0].offsetWidth - borderWidth - 1) + 'px'); // adjust heading div to match table
    $hdiv.find('div').css('height', (maxHeight + padding + 2) + 'px');
    $tbl.data("lastScrollLeft", -1); // initialize for table scroll
    $div.each(function () {
        var $d = $(this);
        //$d.height('auto'); // recalc height
        $d.css('margin-top', (((maxHeight - $d.height()) / 2) - maxHeight) + 'px').css('height', $d.height() + 'px').css('width', $d.css('maxWidth')); // restore width
    });
    this.FixedHeadingScroll({ target: $tbl[0] });
}

Zpm.prototype.FixedHeadingScroll = function (e) {
    if ($(e.target).data("lastScrollLeft") != e.target.scrollLeft) { // ignore vertical scrolls
        var tbl = e.target;
        var $div = $(tbl).find('thead th div');
        var tblRight = tbl.scrollLeft + $(tbl).width();
        $(tbl).data("lastScrollLeft", tbl.scrollLeft);

        var left = 0;
        $div.each(function() {
            var $d = $(this);
            var width = $d.width();
            var clipRec = 'auto'; // in full view
            if (left < tbl.scrollLeft) { // column isscrolled off table to left
                if (left + width > tbl.scrollLeft)
                    clipRec = 'rect(0px,' + width + 'px,' + $d[0].offsetHeight + 'px,' + (tbl.scrollLeft - left) + 'px)'; // partially in view
                else
                    clipRec = 'rect(0px,0px,0px,0px)'; // completely out of view
            } else if (left + width > tblRight) { // off on right
                if (left < tblRight)
                    clipRec = 'rect(0px,' + (tblRight - left) + 'px,' + $d[0].offsetHeight + 'px,0px)';  // partially in view
                else
                    clipRec = 'rect(0px,0px,0px,0px)';  // completely out of view
            }
            $d.css('marginLeft', -tbl.scrollLeft + 'px').css('clip', clipRec);
            left += width;
        });
    }
}


Zpm.prototype.MoveCss = function (style, newFromValue, $from, $to) {
    var fromStyle = $from.css(style);
    var toStyle = $to.css(style);
    if (!(fromStyle === undefined) && (toStyle === undefined || fromStyle != toStyle)) {
        $to.css(style, fromStyle);
        $from.css(style, newFromValue);
        return true;
    }
    return false;
}

Zpm.prototype.CopyCss = function (style, $from, $to) {
    var fromStyle = $from.css(style);
    var toStyle = $to.css(style);
    if (!(fromStyle === undefined) && (toStyle === undefined || fromStyle != toStyle)) {
        $to.css(style, fromStyle);
        return true;
    }
    return false;
}

// based on https://stackoverflow.com/questions/1805808/how-do-i-scroll-a-row-of-a-table-into-view-element-scrollintoview-using-jquery
Zpm.prototype.ScrollIntoView = function ($element, $container) {
    var containerTop = $container.scrollTop();
    var containerBottom = containerTop + $container.height();
    var elemTop = $element[0].offsetTop - $container[0].offsetTop;
    var elemBottom = elemTop + $element.height();
    if (elemTop-10 < containerTop) {
        $container.scrollTop(elemTop-10);
    } else if (elemBottom > containerBottom) {
        $container.scrollTop(elemBottom - $container.height());
    }
 }

// use TableSortDefaults to change default column and assending/descending
Zpm.prototype.TableSortDefaults = function ($table, columnIndex, assending) {
    $table.attr('sort-assending', assending);
    $table.attr('sort-column', columnIndex);
};

Zpm.prototype.TableReSort = function ($table) {  // sort table rows based on last or default sort
    if ($table.attr('sort-column') === undefined) // set defaults
        zpm.TableSortDefaults($table, 0, true);
    $table.attr('sort-assending', ($table.attr('sort-assending') == 'true') ? 'false' : 'true'); // toggle value
    var columnIndex = parseInt($table.attr('sort-column'));
    $($table[0].rows[0].cells[columnIndex]).click();
};

// based on https://stackoverflow.com/questions/22906760/jquery-sort-table-data
Zpm.prototype.TableSort = function (th, fnSort) {  // sort table rows
    // th is the column heading clicked on
    $table = $(th).closest('table');

    if (fnSort === undefined)
        fnSort = Zpm.prototype.RowTextCompare;

    if ($table.attr('sort-column') === undefined) // set defaults
        zpm.TableSortDefaults($table, 0, true);
    var columnIndex = parseInt($table.attr('sort-column'));
    var assending = ($table.attr('sort-assending') == 'true');

    if (th != null) { // if th is null, re-sort $table according to last sort
        columnIndex = th.cellIndex
        assending = (columnIndex == th.cellIndex) ? !assending : true;  // default to assending if switching to a new column,
        $table.attr('sort-assending', assending); // save setting
        $table.attr('sort-column', columnIndex);
    }

    var tbody = $table.find('tbody');
    tbody.find('tr').sort(function (a, b) { return fnSort(a, b, columnIndex, assending); }).appendTo(tbody);
    tbody.find('tr').each(function () { // clear sort text cache, if used
        if (!(this.op_sortData === undefined))
            delete this.op_sortData;
    });

    var sr = $table.find('.selected-row');
    if (sr.length == 1) {
        $table.scrollTop(sr[0].offsetTop - 150); // scroll into view
        $table.focus();
    }
};

Zpm.prototype.RowTextCompare = function (a, b, columnIndex, assending) {
    if (a.SortData === undefined)
        a.op_sortData = a.cells[columnIndex].textContent; // set sort text once
    if (b.SortData === undefined)
        b.op_sortData = b.cells[columnIndex].textContent;  // set sort text once
    return (assending) ? a.op_sortData.localeCompare(b.op_sortData) : b.op_sortData.localeCompare(a.op_sortData);
};

// base on https://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric
Zpm.prototype.IsNumeric = function (n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
};

Zpm.prototype.BlankIfNull = function (str) {
    return (str == null ? "" : str);
};

// reject names with invalid characters for a filename
Zpm.prototype.ValidFileName = function (name) {
    if (name == "")
        return "Name cannot be blank";
    if (name.indexOf('<') >= 0)
        return "Name cannot contain the '<' character.";
    if (name.indexOf('>') >= 0)
        return "Name cannot contain the '>' character.";
    if (name.indexOf('*') >= 0)
        return "Name cannot contain the asterik character.";
    if (name.indexOf('~') >= 0)
        return "Name cannot contain the ~ character.";
    return "";
}

Zpm.prototype.DatePickerOptions = {
    dateFormat: "mm/dd/yy",
    onSelect: this.DatePickerOnSelect,
    showOtherMonths: true,
    selectOtherMonths: true,
    beforeShow: this.DatePickerBeforeShow
}

Zpm.prototype.DatePickerOnSelect = function (dateText, inst) { // on datepicker close, focus to the next input field
    var fields = $('input, select,textarea');
    $(this).change(); // tRigger changed event
    for (var i = 0; i < fields.length; i++) {
        if (fields[i].id == inst.id) {
            for (i = i + 1; i < fields.length; i++) {
                if (fields[i].type != 'hidden') {
                    fields[i].focus(); // focus change will trigger onchange event
                    return
                }
            }
            break;
        }
    }
    if (!(inst.input[0].onchange === undefined) && inst.input[0].onchange != null)
        inst.input[0].onchange(inst);  // onchange event handler if focus not moved.
}

Zpm.prototype.DatePickerBeforeShow = function (textbox, instance) {
    if ($(textbox).attr('readonly') !== undefined) { // if read only
        if (instance.o_dpDiv === undefined) {
            instance.o_dpDiv = instance.dpDiv;  // save it first time
        }
        instance.dpDiv = $('<div style="display: none;"></div>'); // display nothing, effectively ignore.
    } else { // otherwise show
        if (instance.o_dpDiv !== undefined) {
            instance.dpDiv = instance.o_dpDiv;
        }
        switch ($(textbox).attr("data-pos")) {
            case 'right':
                instance.dpDiv.css({ marginTop: (-textbox.offsetHeight) + 'px', marginLeft: textbox.offsetWidth + 'px' });
                break;
            default:
                instance.dpDiv.css({ marginTop: '0px', marginLeft: '0px' });
                break;
        }
    }
}

Zpm.prototype.FormatDate = function (dt) {
    if (dt == null || dt=="")
        return "";
    if (dt instanceof Date) {
    } else if (dt.indexOf("/Date(") == 0) {
        dt = new Date(parseInt(dt.replace('/Date(', '')));
    } else {
        dt = new Date(parseInt(dt));
    }
    var d = (((101 + dt.getMonth()) * 100 + dt.getDate()) * 10000 + dt.getFullYear()).toString();
    return d.substring(1, 3) + "/" + d.substring(3, 5) + "/" + d.substring(5);
}

// -----------------------------------------------------------------------
let AjaxCallbackTimer = null;
let AjaxMethodUrl = null;
let AjaxWaitMilliSeconds = 30;

Zpm.prototype.AjaxCallbackTimer = function (methodUrl, waitSeconds) {
    if (AjaxCallbackTimer == null) {
        AjaxWaitMilliSeconds = ((waitSeconds === undefined) ? 30 : waitSeconds) * 1000;
        AjaxMethodUrl = methodUrl;
        var $ajaxLock = $('#ajaxLock');
        if ($ajaxLock.length == 0) {
            $('body').append( // add if not found
                '<div id="ajaxLock" style="display: normal; position: absolute; left: 0; top: 0; width: 100 %; height: 100 %; z - index: 9999"></div>' +
                '<div id = "ajaxBusy" style = "display:none;  position: absolute; opacity:.7; background: #aaa; left:0; top:0; width:100%; height:100%; z-index: 9999" >' +
                '    <img src="/Content/images/loading.gif" style="position:absolute; top:50%; left:50%; width:100px; height:100px; margin-top:-50px; margin-left:-50px;">' +
                '    <div id="ajaxBusyCounter" style="position:absolute; top:50%; left:50%; width:50px; height:50px; margin-top:-12px; margin-left:-25px;text-align:center;' +
                '         font-weight: bold; font-size:1.8em; color:white;">10</div>' +
                '</div >');
        } else
            $ajaxLock.show(); // lock user input

        AjaxCallbackTimer = setInterval(this.AjaxCallbackCheck, 100, new Date());
    }
}

Zpm.prototype.AjaxCallbackCheck = function (startTime) {
    if ($.active == 0) {  // no ajax calls active
        clearInterval(AjaxCallbackTimer);
        AjaxCallbackTimer = null;
        $('#ajaxBusy, #ajaxLock').hide();
    } else if (((new Date()) - startTime) > 750 && AjaxCallbackTimer != null) {
        if ($('#ajaxBusy').is(':visible')) {
            var seconds = Math.floor(((new Date()) - startTime) / 1000);
            if (seconds > AjaxWaitMilliSeconds) {
                clearInterval(AjaxCallbackTimer);
                AjaxCallbackTimer = null;
                $('#ajaxBusy, #ajaxLock').hide();
                alert("Server call " + AjaxMethodUrl + " timeout.");
            } else if (seconds > 0)
                $('#ajaxBusyCounter').text(seconds);
        } else {
            $('#ajaxBusyCounter').text("");
            $('#ajaxBusy').show();
        }
    }
}

// open another window and set reference to parent window in child
Zpm.prototype.OpenChildWindow = function(url, varNameForParentWin) {
    var win = {};
    win.Handle = window.open(url);
    win.Timer = setInterval(function () {
        if (!(win.Handle[varNameForParentWin] === undefined)) {  // allow window to open, if error here - variable name is probably incorrect
            win.Handle[varNameForParentWin] = window; // provide CustomerView window to Contact View.
            clearInterval(win.Timer);
        }
    }, 500);
    return win;
}

// ---------------------------------------------------------------------
// string, number prototype extensions ------------------------------------------------
// ---------------------------------------------------------------------

// from: http://cwestblog.com/2011/07/25/javascript-string-prototype-replaceall/
String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

// Pad Right
String.prototype.padRight = function (l, c) {
    return this + Array(l - this.length + 1).join(c || " ");
}

// Pad Left
String.prototype.padLeft = function (l, c) {
    return Array(l - this.length + 1).join(c || " ") + this;
}

// from: https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
Number.prototype.numberWithCommas = function (decimals) {
    var parts = this.toFixed(decimals).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
};