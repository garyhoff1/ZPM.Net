// Zpm Report Builder
/*
Copyright(c) 2018 Zpm Software Inc, ZpmSoftware.com

The Code Project Open License (CPOL) governs Your use of ZPM.Net.
This License is intended to allow developers to use the Source Code
and Executable Files provided as part of the Work in any application in any form.

The full agremeent is available at: https://www.codeproject.com/info/cpol10.aspx
*/

function ZpmReportBuilder(reportTableSelector, urlBase) {
    var FindElement = function (selector) { // private function
        var e = $(selector);
        if (e.length == 0)
	        throw "Element '" + selector + "' not found";
        return e;
    }
    document.zpmReportBuilder = this;
	this.enableAutoAddColumn = true;
	this.urlBase = urlBase;
	this.report = {};
	this.savedReports = null;
	zpm.FixedHeading(FindElement(reportTableSelector)); // create fixed heading elments
	this.$reportTable = FindElement(reportTableSelector);

	// controls are defined by caller
	this.$orderBy = FindElement('#OrderBy');
	this.$reportName = FindElement('#ReportName');
	this.$reportOptions = FindElement('#ReportOptions');
	this.$filterTemplates = $('#FilterOptions .zpm-filter'); // 0 elements if no custom filters
	this.$showOptions = FindElement('#ShowOptions');
	this.$message = FindElement('#Message');
    this.$PdfPortrait = $('#PdfPortrait'); // not required
    this.$PdfLandscape = $('#PdfLandscape'); // not required
	this.LoadColumns(this.$reportTable, this.report);

	// Initialize Filters
	this.$filterTable = FindElement('#zpmFilterTable');
	//var $tr = this.$filterTable.find('tr');
	//this.filterTrHtml = $tr[0].outerHTML;
	//$tr.find('.zpm-filter-and-or a').hide(); // hide first one.

	FindElement('#Main').show(); // hide until now, must be visible fot chosen.
	this.$reportOptions.find('.chosen-select').chosen();
	$('#FilterOptions').hide(); // need to show initially so elements render

	window.onresize = function (event) { ZpmReportBuilder.prototype.ReportTableResize('"' + reportTableSelector + '"'); };
	$('.zpm-fixed-heading-container').hide();
	this.$reportOptions.hide();
	this.ReportTableResize();
}

ZpmReportBuilder.prototype.RemoveAutoAddedColumn = function (e) {
    if (this.enableAutoAddColumn) {
        var columnName = $(e).attr('data-auto-added');
        if (!(columnName === undefined)) {
            var idx = this.report.ChosenColumnNames.indexOf(columnName);
            if (idx >= 0) {
                this.report.ChosenColumnNames.splice(idx, 1); // remove it
                this.SetReportColumnList();
                this.SetReportOrderBy();
            }
            $(e).removeAttr('data-auto-added');
        }
    }
}

ZpmReportBuilder.prototype.AddNewColumn = function (columnName) {
    this.report.ChosenColumnNames.push(columnName);
    this.SetReportColumnList();
    this.SetReportOrderBy();
}

ZpmReportBuilder.prototype.ReportTableResize = function (reportTableSelector) {
	var $rt = this.$reportTable;
	if ($rt === undefined)
		$rt = $(reportTableSelector.replaceAll('"', ''));
	var h = window.innerHeight - $rt.offset().top - 60;
	$rt.css('max-height', h + 'px');
}

ZpmReportBuilder.prototype.LoadColumns = function ($tbl, report) {
    var $th = $tbl.find("thead th");
    var $td = $tbl.find("tbody td");
    if ($th.length != $td.length) {
        alert("Internal Error: Number of column headings (th) must match columns (td)");
        return;
    }
    report.Columns = [];
    for (var x = 0; x < $th.length; x++) {
        var col = {};
        col.ThHtml = $th[x].outerHTML;
        col.TdHtml = $td[x].outerHTML;
        col.Heading = $th[x].textContent.trim();
        col.TextName = $($th[x]).attr('data-text-name');
        if (col.TextName === undefined)
            col.TextName = col.Heading; // default to heading
        col.ReportType = $($th[x]).attr('data-report-type');
        this.ColumnName($td[x], col);
        report.Columns.push(col);
    }
    var $tr = $tbl.find("thead tr");
    report.trHeadHtml = $tr[0].outerHTML;
    $tr.html(""); // clear inner html
    var $tr = $tbl.find("tbody tr");
    $tr.html(""); // clear inner html
    report.trHtml = $tr[0].outerHTML;
    this.$message.text("");
};

ZpmReportBuilder.prototype.ColumnName = function (td, col) {
	var s = td.innerHTML.indexOf("{");
	var e = td.innerHTML.indexOf("}", s);
	col.TextReplace = td.innerHTML.substring(s, e + 1);
	col.Name = td.innerHTML.substring(s + 1, e);
}

ZpmReportBuilder.prototype.CurrentReportModel = function () {
	var reportIdx = this.$reportName.val();
	if (reportIdx == "" || reportIdx == '+')
		return null;
	var report = this.savedReports.Reports[parseInt(reportIdx)];
	if (report.Parms === undefined)
	    report.Parms = JSON.parse(report.Value); // unpack
	if (report.Parms.Filters === undefined) // GH remove this
	    this.ConvertParameters(report.Parms);
    return report;
}

ZpmReportBuilder.prototype.ConvertParameters = function (parms) { } // hook for older versions

ZpmReportBuilder.prototype.SetReportNames = function (data) {
	this.savedReports = data;
	this.$reportName.html(this.$reportName[0].options[0].outerHTML + this.$reportName[0].options[1].outerHTML); //keep first 2
	if (this.savedReports.Reports.length > 0) {
		this.AddReportGroups(true); // add all named groups
		this.AddReportGroups(false); // add "Other"
	}
	this.savedReports.SelectedtReport = 0; // only use once
	this.ReportNameChanged();
}

ZpmReportBuilder.prototype.AddReportGroups = function (addGroupNames) { // first add named groups, then unnamed last
	var closeGroup = false;
	var reportGroup = (this.$reportName[0].options.length > 2) ? "~" : ""; // if named groups, then force insert "My Private Reports", else don't add
	var optionsHtml = ""
	for (var i = 0; i < this.savedReports.Reports.length; i++) {
		var rpt = this.savedReports.Reports[i];
		if (rpt.Parms === undefined)
			rpt.Parms = JSON.parse(rpt.Value); // unpack
		if (!rpt.Parms.ReportGroup) // temp fix
			rpt.Parms.ReportGroup = "";

		if (addGroupNames == (rpt.Parms.ReportGroup != "")) {
			if (rpt.Parms.ReportGroup != reportGroup) { // group change
				if (closeGroup)
					optionsHtml += '</optgroup>';
				reportGroup = rpt.Parms.ReportGroup;
				closeGroup = true;
				optionsHtml += '<optgroup label="' + (reportGroup == "" ? "My Private Reports" : reportGroup) + '" style="color:white; background:#aaa;">';
            }
            var reportName = this.ReportDisplayName(rpt);
			if (this.ReportId(rpt) == this.savedReports.DefaultReport)
				reportName += "*";

			if ((this.ReportId(rpt) == this.savedReports.DefaultReport && this.savedReports.SelectedtReport == 0) || this.ReportId(rpt) == this.savedReports.SelectedtReport)
				optionsHtml += "<option style='color:black; background:white' value='" + i + "' selected=''>" + reportName + "</option>";
			else
				optionsHtml += "<option style='color:black; background:white' value='" + i + "'>" + reportName + "</option>";
		}
	}
	if (closeGroup)
		optionsHtml += '</optgroup>';
	this.$reportName.append(optionsHtml);
}

ZpmReportBuilder.prototype.ReportDisplayName = function (report) {
    var reportName = report.Parms.ReportName;
    if (report.Parms.ReportGroup != "") {
        reportName += (report.Parms.Share == "NoShare") ? " (" + report.CreatedByUserInitials + " private)" : " (" + report.CreatedByUserInitials + " shared)";
    }
    return reportName;
}

ZpmReportBuilder.prototype.FilterConditionHtml = function (filterName) {
    switch (filterName) {
        case "zpm-filter-condition-string":
            return '<div class="zpm-filter" data-filter-name="zpm-filter-condition-string" data-type="zpm-filter-condition-string">' +
                '   <select>' +
                '      <option value="SW" selected="">starts with</option>' +
                '      <option value="EQ">equal to</option>' +
                '      <option value="CO">contains</option>' +
                '      <option value="GT">greater than</option>' +
                '      <option value="GE">greater or =</option>' +
                '      <option value="LT">less than</option>' +
                '      <option value="LE">less than or =</option>' +
                '   </select>' +
                '   <input class="zpm-filter-text" type="text" maxlength="80" />' +
                '</div >';
        case "zpm-filter-condition-integer":
            return '<div class="zpm-filter" data-filter-name="zpm-filter-condition-integer" data-type="zpm-filter-condition-integer">' +
                '   <select>' +
                '      <option value="EQ" selected="">equal to</option>' +
                '      <option value="GT">greater than</option>' +
                '      <option value="GE">greater or =</option>' +
                '      <option value="LT">less than</option>' +
                '      <option value="LE">less than or =</option>' +
                '   </select>' +
                '   <input class="zpm-filter-text" type= "text" maxlength= "80" />' +
                '</div>';

        case "zpm-filter-condition-number":
            return '<div class="zpm-filter" data-filter-name="zpm-filter-condition-number" data-type="zpm-filter-condition-number">' +
                '   <select>' +
                '      <option value="EQ" selected="">equal to</option>' +
                '      <option value="GT">greater than</option>' +
                '      <option value="GE">greater or =</option>' +
                '      <option value="LT">less than</option>' +
                '      <option value="LE">less than or =</option>' +
                '   </select>' +
                '   <input class="zpm-filter-text" type= "text" maxlength= "80" />' +
                '</div>';

        case "zpm-filter-condition-date":
            return '<div class="zpm-filter" data-filter-name="zpm-filter-condition-date" data-type="zpm-filter-condition-date">' +
                   '   <select class="zpm-filter-condition" onchange="rb.DateFilterConditionChange(this, true);" >' +
                   '      <option value="DR" selected="">date range</option>' +
                   '      <option value="EQ">equal to</option>' +
                   '      <option value="IB">is blank</option>' +
                   '      <option value="NB">not blank</option>' +
                   '      <option value="GT">greater than</option>' +
                   '      <option value="GE">greater or =</option>' +
                   '      <option value="LT">less than</option>' +
                   '      <option value="LE">less than or =</option>' +
                   '   </select >' +
                   '   <div class="date-range" style= "display:inline;" > ' +
                   '      <div class="zpm-filter-date-from zpm-filter-date" style="display:inline">' +
                   '         <b class="zpm-filter-date-from-prompt" >&nbsp; FROM</b > ' +
                   '         <select class="zpm-filter-date-type" onchange="rb.ZpmFilterDateTypeChange(this, true);">' +
                   '            <option value="D">date</option>' +
                   '            <option value="T">today</option>' +
                   '            <option value="MS">1st of this month</option>' +
                   '            <option value="ME">end of this month</option>' +
                   '            <option value="YS">start of this year</option>' +
                   '            <option value="YE">end of this year</option>' +
                   '         </select>' +
                   '         <div class="zpm-filter-date-relative" style="display:none">' +
                   '            <input type="text" style="width:30px; text-align:center" value="+0" onblur="rb.ZpmDateOffsetChange(this);" />' +
                   '            <select onchange="rb.ZpmDateFilterComment(this)">' +
                   '               <option value="D">Days</option>' +
                   '               <option value="W">Weeks</option>' +
                   '               <option value="M">Months</option>' +
                   '               <option value="Y">Years</option>' +
                   '            </select>' +
                   '         </div>' +
                   '         <input class="datepicker" type="text" style="width:85px" onchange="rb.ZpmDateFilterComment(this)" />' +
                   '      </div>' +
                   '      <div class="zpm-filter-date-to zpm-filter-date" style="display:inline">' +
                   '         <b>&nbsp;TO</b>' +
                   '         <select class="zpm-filter-date-type" onchange="rb.ZpmFilterDateTypeChange(this, true);">' +
                   '            <option value="D">date</option>' +
                   '            <option value="T">today</option>' +
                   '            <option value="MS">1st of this month</option>' +
                   '            <option value="ME">end of this month</option>' +
                   '            <option value="YS">start of this year</option>' +
                   '            <option value="YE">end of this year</option>' +
                   '         </select>' +
                   '         <div class="zpm-filter-date-relative" style="display:none">' +
                   '            <input type="text" style="width:30px; text-align:center" value="+0" onblur="ZpmDateOffsetChange(this);" />' +
                   '            <select onchange="rb.ZpmDateFilterComment(this)">' +
                   '               <option value="D">Days</option>' +
                   '               <option value="W">Weeks</option>' +
                   '               <option value="M">Months</option>' +
                   '               <option value="Y">Years</option>' +
                   '            </select>' +
                   '         </div>' +
                   '         <input class="datepicker" type="text" style="width:85px" onchange="rb.ZpmDateFilterComment(this)" />' +
                   '      </div>' +
                   '   </div>' +
                   '</div >';

        case "zpm-filter-condition-bool":
            return '<div class="zpm-filter" data-filter-name="zpm-filter-condition-bool" data-type="zpm-filter-condition-bool">' +
                '   <select>' +
                '      <option value="1" selected=""> Is True</option>' +
                '      <option value="0"> Is False</option>' +
                '   </select>' +
                '</div>';

        default: // custom filters
            var $filter = this.$filterTemplates.filter("[data-filter-name='" + filterName + "']");
            if ($filter.length == 1)
                return $filter[0].outerHTML;
            alert("Filter name '" + filterName + "' not found.");
            return "";
    }

}

ZpmReportBuilder.prototype.FilterOptionChanged = function (e, autoAddColumn) {
	var fieldName = $(e).val();
	var $tr = $(e).closest('tr');
	var $details = $tr.find('.zpm-filter-details');
	var $not = $tr.find('.zpm-filter-not');
	$tr.find('.zpm-filter-comment span').text("");
    this.RemoveAutoAddedColumn(e);

	if (fieldName == "") {
		$details.html("");
		$not.hide();
	} else {
        $not.show();
		var filterName = $(e).find(":selected").attr('data-filter-name');
        var detailsHtml = this.FilterConditionHtml(filterName);
		//var $filter = this.$filterTemplates.filter("[data-filter-name='" + filterName + "']");
        if (detailsHtml != "") {
            $details.html(detailsHtml);
			$details.find('[data-type]').attr('data-name', fieldName); // add the field name as an attribute

			if (this.report.ChosenColumnNames.indexOf(fieldName) == -1) { // check to see if column is on report and add or ask if not.
				if (autoAddColumn) {
				    if (this.enableAutoAddColumn) {
				        $(e).attr('data-auto-added', fieldName);
				        this.AddNewColumn(fieldName);
					} else { // ask user
						var col = this.ReportColumnByName(fieldName, this.report);
						PopupDialogCss = "";
						PopupDialogHtml = "<div style='color:black; width:100%; font-size:1.3em'>Add " + col.TextName + " as a report column?</div>";
						genericDialogShow({
							url: 'PopupDialog.aspx',
							height: 150,
							width: 550,
							title: col.TextName + " is not a column on the report.",
							position: { my: "left+10 top+25", at: "left top", of: $tr },
							buttons: {
								"YES": function (event, ui) {
								    $(this).dialog('close');
                                    document.zpmReportBuilder.AddNewColumn(fieldName);
								},
								"NO": function (event, ui) { $(this).dialog('close'); }
							}
						});
					}
				}
			}
		} else { // shouldn't happen
			$details.html("");
			$not.hide();
		}

		if (this.$reportOptions.is(':visible')) { // only if options are visible
			$tr.find(".datepicker").datepicker(zpm.DatePickerOptions);
			$tr.find(".chosen-select").chosen();
		}
	}
}

ZpmReportBuilder.prototype.ReportHeading = function ($tbl, report) {
	$tbl.find("thead").html(report.trHeadHtml);
	var thHtml = "";
	for (var x = 0; x < report.ChosenColumnNames.length; x++) {
		for (var i = 0; i < report.Columns.length; i++) {
			if (report.ChosenColumnNames[x] == report.Columns[i].Name) {
				thHtml += report.Columns[i].ThHtml;
				break;
			}
		}
	}
	$tbl.find("thead tr").html(thHtml); // set heading
	$tbl.find("tbody").html(""); // clear rows
	var $th = $tbl.find("thead th");
	var maxHeight = 0;
	$th.each(function () {
		$div = $(this).find('div');
		if ($div.width() == 0)
			$div.css('width', ''); // remove if current setting is 0
		$(this).css("min-width", ($div.width() + 10) + 'px');
		maxHeight = Math.max(maxHeight, $div.height());
	}); // resize th to match div
	$('#AddressReportHeading').css('height', (maxHeight + 6) + 'px');
	$th.each(function () {
		var $div = $(this).find('div');
		$div.css('margin-top', (-maxHeight - 3) + 'px').css('padding-top', (maxHeight - $div.height()) / 2 + 'px');
	});
}

ZpmReportBuilder.prototype.EnableButtons = function () {
	switch (this.$reportName.val()) {
	    case '': // select report
	        $('.report-output-button, #btnChooseColumns, #btnClearOptions, #btnSaveReport, #btnMakeDefault').prop("disabled", true);
	        break;
	    case '+':
	        $('#btnChooseColumns, #btnClearOptions, #btnSaveReport').prop("disabled", false);
	        $('#btnMakeDefault').prop("disabled", true); // report must be saved first
	        $('.report-output-button').prop("disabled", (this.report.ChosenColumnNames.length == 0));
	        break;
	    default:
	        $('#btnChooseColumns, #btnClearOptions, #btnSaveReport, #btnMakeDefault').prop("disabled", false);
	        $('.report-output-button').prop("disabled", (this.report.ChosenColumnNames.length == 0));
	        break;
	}
}

ZpmReportBuilder.prototype.ClearOptions = function (addBlankFilter) {
	if (addBlankFilter) {
        this.$filterTable.html(this.FilterTableRowHtml());
		this.$filterTable.find('.zpm-filter-and-or a').hide();
	} else
		this.$filterTable.html("");

	$('#reportColumnList').html("<span>No columns selected.</span>");
	this.report.ChosenColumnNames = [];
	$('.zpm-fixed-heading-container').hide();
	// clear misc.
	this.$reportOptions.find('input[type=text]').val(""); // clears all text boxes
	this.$reportOptions.find('input[type=checkbox]').val(false); // clears all checkboxes
    this.$reportOptions.find('.chosen-select').val('').trigger('chosen:updated'); // clears selection boxes
    this.$PdfPortrait.prop("checked", true);
	this.$message.text("");
}

ZpmReportBuilder.prototype.RunReportParameters = function (data) {
	return {
		ReportName: data.ReportName,
		ReportDescription: data.ReportDescription,
		ColumnNames: data.ColumnNames,
		ColumnHeadings: data.ColumnHeadings,
        OrderBy: data.OrderBy,
        PdfOrientation: data.PdfOrientation,
		Filters: data.Filters
	};
}

ZpmReportBuilder.prototype.ReportColumnByName = function (name, report) {
	for (var x = 0; x < report.Columns.length; x++) {
		if (name == report.Columns[x].Name)
			return report.Columns[x];
	}
	return null;
}

ZpmReportBuilder.prototype.GetChooseColumns = function () {
    var $div = $('#ChooseColumns');
    if ($div.length == 0) {
        $('body').append('<div id= "ChooseColumns" title= "Choose Report Columns" style= "display:none"></div >');
        $div = $('#ChooseColumns');
    }
    $div.html('<select id="reportColumns" class="multiselect" multiple style="width:450px; height:400px;"></select>'); // have to rebuild every time in case list changed outside of multiselect
    return $div;
}

ZpmReportBuilder.prototype.ChooseColumns = function (report, optionalMessage) {
    var $ccDiv = this.GetChooseColumns();

	var reportOptions = "";
	for (var i = 0; i < report.ChosenColumnNames.length; i++) {
		var col = this.ReportColumnByName(report.ChosenColumnNames[i], report);
		if (col != null)
			reportOptions += "<option selected value='" + col.Name + "'>" + col.TextName + "</option>";
	}
	for (var x = 0; x < report.Columns.length; x++) {
		for (var i = 0; i < report.ChosenColumnNames.length && report.ChosenColumnNames[i] != report.Columns[x].Name; i++);
		if (i == report.ChosenColumnNames.length)
			reportOptions += "<option value='" + report.Columns[x].Name + "'>" + report.Columns[x].TextName + "</option>";
	}
	$('#reportColumns').html(reportOptions);
    $ccDiv.dialog({
		title: "CHOOSE REPORT COLUMNS",
        autoOpen: false, modal: true, show: "fade", hide: "fade", width: 530,
		buttons: {
			'Done': function () {
                document.zpmReportBuilder.SaveColumnChanges();
				$(this).dialog("close");
                document.zpmReportBuilder.EnableButtons();
			},
			'Cancel': function () {
				$(this).dialog("close");
			}
		}
	});
	$.ui.multiselect.locale.itemsCount = "columns selected";
    $(".multiselect").multiselect({ dividerLocation: 0.5, availableFirst: true, message: (optionalMessage) ? optionalMessage : "xx" });
    $ccDiv.dialog("open");
}

ZpmReportBuilder.prototype.SaveColumnChanges = function () {
	this.report.ChosenColumnNames = [];
	$("#ChooseColumns ul.selected li").each(function () {
		var value = $(this).attr('data-selected-value');
		if (!(value == undefined))
            document.zpmReportBuilder.report.ChosenColumnNames.push(value);
	});
	this.SetReportColumnList();
	this.SetReportOrderBy();
}

ZpmReportBuilder.prototype.ToggleOptions = function () {
	this.$reportOptions.toggle();
	if (this.$reportOptions.is(':visible')) {
		this.$showOptions.text("Hide options");
		this.$reportOptions.find(".datepicker").not('.hasDatepicker').datepicker(zpm.DatePickerOptions);
		this.$reportOptions.find(".chosen-select:visible").chosen(); // if not visible, then already chosen.
	} else {
		this.$showOptions.text("Show options");
	}
	this.ReportTableResize();
}

ZpmReportBuilder.prototype.ReportNameChanged = function () {
	var reportDescription = "";
	$('.zpm-fixed-heading-container').hide();
	$('#Message').text("");
	switch (this.$reportName.val()) {
		case '': // select report
			this.$showOptions.hide();
			if (this.$reportOptions.is(':visible'))
				this.ToggleOptions(); // close it
			this.ClearOptions(false);
			this.EnableButtons();
			break;
		case '+':
			this.$showOptions.hide();
			this.ClearOptions(true);
			this.EnableButtons();
			if (!this.$reportOptions.is(':visible'))
				this.ToggleOptions(); // open it
			break;
		default:
            var rm = this.CurrentReportModel();
			this.$showOptions.show();
            this.ClearOptions(false);
            reportDescription = rm.Parms.ReportDescription + " (" + (rm.Parms.Share == "NoShare" ? "not shared" : "shared by " + rm.CreatedByUserInitials) + ")"; 
			this.report.ChosenColumnNames = rm.Parms.ColumnNames;
			this.SetReportColumnList();

			this.SetReportOrderBy(); // add selected columns to order by list
            Chosen.prototype.set_chosen_order(this.$orderBy, rm.Parms.OrderBy); //  this.SetChosenOrder(this.$orderBy, rm.Parms.OrderBy);
            if (rm.Parms.PdfOrientation == 'L')
                this.$PdfLandscape.prop("checked", true);
            else
                this.$PdfPortrait.prop("checked", true);

            if (rm.Parms.Filters != null) {
                for (var i = 0; i < rm.Parms.Filters.length; i++) {
                    var f = rm.Parms.Filters[i];
                    switch (f.Type) {
                        case "zpm-filter-condition-string":
                        case "zpm-filter-condition-integer":
                        case "zpm-filter-condition-number":
                            this.ConditionalFilterSet(f);
                            break;
                        case "zpm-filter-condition-date":
                            this.ConditionalDateFilterSet(f);
                            break;
                        case "zpm-filter-condition-bool":
                            this.ConditionalBoolFilterSet(f);
                            break;
                        case 'zpm-filter-chosen-integer':
                        case 'zpm-filter-chosen-string':
                            this.ArrayFilterSet(f);
                            break;
                        case "zpm-filter-string":
                            break;
                        default:
                            debugger;
                            break;
                    }
                }
            }
            if (this.$filterTable[0].rows.length == 0) {
                this.$filterTable.html(this.FilterTableRowHtml());
                this.$filterTable.find('.zpm-filter-and-or a').hide();
            }
			this.EnableButtons();
			break;
	}
	$('#ReportDescription').text(reportDescription);
}

ZpmReportBuilder.prototype.FilterTableRowHtml = function () {
    return '<tr>' +
        '   <td class="zpm-filter-and-or"><a onclick="document.zpmReportBuilder.AndOrToggle(this)">AND</a></td>' +
        '   <td><div class="zpm-filter-open-paren"></div></td>' +
        '   <td>' +
        '      <select class="zpm-filter-select" onchange= "document.zpmReportBuilder.FilterOptionChanged(this)" >' +
        $('#FilterOptions .zpm-filter-select').html() +
        '      </select > ' +
        '   </td>' +
        '   <td>' +
        '      <div class="zpm-filter-not" style="display:none" > ' +
        '         <input class="zpm-filter-not-cb" type="checkbox" style="vertical-align: sub;"/>not' +
        '      </div>' +
        '   </td>' +
        '   <td class="zpm-filter-details"></td>' +
        '   <td><div class="zpm-filter-close-paren"></div></td>' +
        '   <td><img class="zpm-filter-menu" src="/Content/images/menuIcon.png" onclick="document.zpmReportBuilder.ZpmFilterMenu(this)"/></td >' +
        '   <td class="zpm-filter-comment" ><span></span><span></span></td>' +
        '</tr>';
}

ZpmReportBuilder.prototype.FilterSet = function (f, $e) {
	var $tr = $e.closest('tr');
	if ($tr.length == 1) {
		if ($tr[0].rowIndex == 0)
			$tr.find('.zpm-filter-and-or a').text("AND").hide();
		else
			$tr.find('.zpm-filter-and-or a').text(f.AndOr);
		$tr.find('.zpm-filter-not-cb').prop("checked", f.Not);
		$tr.find('.zpm-filter-open-paren').text(f.OpenParen);
		$tr.find('.zpm-filter-close-paren').text(f.CloseParen);
	}
}

ZpmReportBuilder.prototype.ConditionalDateFilterSet = function (f) {
	var values = f.Value.split('\t');
	if (values.length == 1) { // GH remove - converting old
		if (f.Condition == "DR") {
			var v = f.Value.split(',');
			values[0] = "D";
			values[1] = v[0];
			values[2] = "";
			values[3] = "D";
			values[4] = v[1];
			values[5] = "";
		} else {
			values[1] = values[0];
			values[2] = "";
			values[0] = "D";
		}
	}


    this.$filterTable.append(this.FilterTableRowHtml());
	var $tr = $(this.$filterTable[0].rows[this.$filterTable[0].rows.length - 1]); // get row just added
	$e = $tr.find('.zpm-filter-select');
	$e.val(f.Name); // select filter name
	this.FilterOptionChanged($e[0], false); // create the filter elements

	var $cond = $tr.find('.zpm-filter-condition');
	$cond.val(f.Condition);
	this.DateFilterConditionChange($cond, false);
	$tr.find('.zpm-filter-comment span').text("");
	switch (f.Condition) {
		case "DR":
			this.SetFilterDateValue($tr.find('.zpm-filter-date-from'), values[0], values[1], values[2], "From");
			this.SetFilterDateValue($tr.find('.zpm-filter-date-to'), values[3], values[4], values[5], "To");
			break;
		case "IB":
		case "NB":
			break;
		default:
			this.SetFilterDateValue($tr.find('.zpm-filter-date-from'), values[0], values[1], values[2], "");
			break;
	}
	this.FilterSet(f, $e);
}

ZpmReportBuilder.prototype.SetFilterDateValue = function ($div, type, value1, value2, commentPrefix) {
	var $e = $div.find('.zpm-filter-date-type');
	$e.val(type);
	this.ZpmFilterDateTypeChange($e[0], false);
	switch (type) {
		case 'D': // date only
			$div.find('.datepicker').val(value1);
			if (commentPrefix != "")
				this.ZpmFilterDateComment($div, value1, commentPrefix);
			break;
		default:
			$div.find('.zpm-filter-date-relative input').val(value1);
			$div.find('.zpm-filter-date-relative select').val(value2);
			this.ServerGetFilterDate(type, value1, value2, function (dt) {
                document.zpmReportBuilder.ZpmFilterDateComment($div, dt, commentPrefix);
			});
			break;
	}
}

ZpmReportBuilder.prototype.ZpmFilterDateComment = function ($div, dt, commentPrefix) {
	$span = $div.closest('tr').find('.zpm-filter-comment span');
	switch (commentPrefix) {
		case "": $($span[0]).text(dt); break;
		case "From": $($span[0]).text("From " + dt); break;
		case "To": $($span[1]).text(" to " + dt); break;
	}
}

ZpmReportBuilder.prototype.ArrayFilterSet = function (f) {
	var $e;
	if (f.Id != "") {
		$e = this.$reportOptions.find('#' + f.Id); // dedicated filter
        Chosen.prototype.set_chosen_order($e, f.Value.split('\t')); // this.SetChosenOrder($e, f.Value.split('\t'));
	} else { // selectable filter
        this.$filterTable.append(this.FilterTableRowHtml());
		$tr = $(this.$filterTable[0].rows[this.$filterTable[0].rows.length - 1]); // get row just added
		$e = $tr.find('.zpm-filter-select');
		$e.val(f.Name); // select filter name
		this.FilterOptionChanged($e[0], false); // create the filter elements
		$e = $tr.find('.zpm-filter').find('select');
        Chosen.prototype.set_chosen_order($e, f.Value.split('\t')); // this.SetChosenOrder($e, f.Value.split('\t'));
	}
	this.FilterSet(f, $e);
}

ZpmReportBuilder.prototype.ConditionalFilterSet = function (f) {
    this.$filterTable.append(this.FilterTableRowHtml());
	$tr = $(this.$filterTable[0].rows[this.$filterTable[0].rows.length - 1]); // get row just added
	var $e = $tr.find('.zpm-filter-select');
	$e.val(f.Name); // select filter name
	this.FilterOptionChanged($e[0], false); // create the filter elements
	$tr.find('.zpm-filter select').val(f.Condition);
	$tr.find('.zpm-filter input').val(f.Value);
	this.FilterSet(f, $e);
}

ZpmReportBuilder.prototype.ConditionalBoolFilterSet = function (f) {
    this.$filterTable.append(this.FilterTableRowHtml());
    $tr = $(this.$filterTable[0].rows[this.$filterTable[0].rows.length - 1]); // get row just added
    var $e = $tr.find('.zpm-filter-select');
    $e.val(f.Name); // select filter name
    this.FilterOptionChanged($e[0], false); // create the filter elements
    $tr.find('.zpm-filter select').val(f.Value);
    this.FilterSet(f, $e);
}

ZpmReportBuilder.prototype.DateFilterConditionChange = function (e, updateComment) {
	var $div = $(e).closest('div');
	switch ($(e).val()) {
		case "DR":
			$div.find('.zpm-filter-date-from-prompt, .zpm-filter-date-to, .zpm-filter-date-from').show();
			var $dt = $div.find('.zpm-filter-date-type');
			if (updateComment) {
				this.ZpmFilterDateTypeChange($dt[0], true);
				this.ZpmFilterDateTypeChange($dt[1], true);
			}
			break;
		case "IB":
		case "NB":
			$div.find('.zpm-filter-date-to, .zpm-filter-date-from').hide();
			if (updateComment)
				$div.closest('tr').find('.zpm-filter-comment span').text("");
			break;
		default:
			$div.find('.zpm-filter-date-from-prompt, .zpm-filter-date-to').hide();
			$div.find('.zpm-filter-date-from').show();
			if (updateComment)
				this.ZpmFilterDateTypeChange($div.find('.zpm-filter-date-type')[0], true);
			break;
	}
}

ZpmReportBuilder.prototype.ZpmFilterDateTypeChange = function (e, updateComment) {
	var $div = $(e).closest('div');
	switch ($(e).val()) {
		case "D":
			$div.find('.zpm-filter-date-relative').hide();
			$div.find('.datepicker').show();
			break;
		default:
			$div.find('.datepicker').hide();
			$div.find('.zpm-filter-date-relative').show();
			break;
	}
	if (updateComment)
		this.ZpmDateFilterComment(e);
}

ZpmReportBuilder.prototype.ZpmDateFilterComment = function (e) {
	var $div = $(e).closest('.zpm-filter-date');
	var commentPrefix = "";
	if ($div.hasClass('zpm-filter-date-from')) {
		if ($div.find('.zpm-filter-date-from-prompt').is(':visible'))
			commentPrefix = "From";
	} else {
		commentPrefix = "To";
	}
	var type = $div.find('.zpm-filter-date-type').val();
	switch (type) {
		case 'D':
			if (commentPrefix != "")
				this.ZpmFilterDateComment($div, $div.find('.datepicker').val(), commentPrefix);
			else
				$div.closest('tr').find('.zpm-filter-comment span').text("");
			break;
		default:
			var value1 = $div.find('.zpm-filter-date-relative input').val();
			var value2 = $div.find('.zpm-filter-date-relative select').val();
			this.ServerGetFilterDate(type, value1, value2, function (dt) {
                document.zpmReportBuilder.ZpmFilterDateComment($div, dt, commentPrefix);
			});
			break;
	}
}

ZpmReportBuilder.prototype.ZpmDateOffsetChange = function (e) {
	var offset = $(e).val().trim().replace('+', '');
	if (offset == "") {
		$(e).val("+0");
	} else {
		var offset = zpm.GetInteger(offset);
		if (offset == null) {
			alert('Invalid number');
			setTimeout(function () { $(e).focus(); }, 100);
			return;
		} else {
			$(e).val(offset < 0 ? offset : "+" + offset);
		}
	}
	this.ZpmDateFilterComment(e);
}

ZpmReportBuilder.prototype.SetReportColumnList = function () {
	var cols = "";
	for (var x = 0; x < this.report.ChosenColumnNames.length; x++) {
		var col = this.ReportColumnByName(this.report.ChosenColumnNames[x], this.report);
		cols += ", " + col.TextName;
	}
	$('#reportColumnList').html((cols == "") ? "<span>No columns selected.</span>" : "<span>Selected columns:</span> " + cols.substring(2));
}

ZpmReportBuilder.prototype.SetReportOrderBy = function () {
	var html = "";
	for (var x = 0; x < this.report.ChosenColumnNames.length; x++) {
		var col = this.ReportColumnByName(this.report.ChosenColumnNames[x], this.report);
		html += '<option value="' + col.Name + '">' + col.TextName + '</option>';
	}
    var orderByVal = Chosen.prototype.get_chosen_order(this.$orderBy);  // this.GetChosenOrder(this.$orderBy);
  
	this.$orderBy.html(html);
	this.$orderBy.trigger("chosen:updated"); // reset options
    Chosen.prototype.set_chosen_order(this.$orderBy, orderByVal); //  this.SetChosenOrder(this.$orderBy, orderByVal);
}

ZpmReportBuilder.prototype.GetSaveReportDialog = function () {
    var $div = $('#SaveReportDialog');
    if ($div.length == 0) {
        $('body').append('<div id="SaveReportDialog" style="background-color:white; color:black; width:100%; display:none">' +
                '<div style="margin-left: 20px;" >' +
                    '<input id="ReportId" type="hidden" />' +
                    '<table>' +
                        '<tr class="notNew">' +
                        '    <td><b>Current report name:</b>&nbsp <span class="current-name" style="font-weight:bold;">NAME</span></td>' +
                        '</tr>' +
                        '<tr class="admin notNew">' +
                        '    <td>' +
                        '        <input id="ZpmSaveReportUpdate" type="radio" name="action" value="Update" checked="checked" onclick="document.zpmReportBuilder.SaveReportDialogInfo(true, false)" />' +
                        '        <label for="ZpmSaveReportUpdate" style="min-height:19px; display:inline-block;">Update report</label>' +
                        '        <span class="update-info">, change name to: <input id="ChangeName" type="text" maxlength="40" style="width:230px;" /></span>' +
                        '    </td>' +
                        '</tr>' +
                        '<tr>' +
                        '    <td>' +
                        '        <input id="ZpmSaveReportAdd" type="radio" name="action" value="Add" onclick="document.zpmReportBuilder.SaveReportDialogInfo(false, true)"/>' +
                        '        <label for="ZpmSaveReportAdd" style="min-height:19px; display:inline-block;">Add new report</label>' +
                        '        <span class="add-info">, new name: <input id="NewName" type="text" maxlength="40" style="width:230px;" /></span>' +
                        '    </td>' +
                        '</tr>' +
                        '<tr class="admin notNew">' +
                        '    <td>' +
                        '        <input id="ZpmSaveReportDelete" type="radio" name="action" value="Delete" onclick="document.zpmReportBuilder.SaveReportDialogInfo(false, false)" />' +
                        '        <label for="ZpmSaveReportDelete" style="position:relative; top:-2px; min-height:19px; display:inline-block;">Delete report</label>' +
                        '    </td>' +
                        '</tr>' +
                        '<tr>' +
                        '    <td><div id="NotMineMsg" runat="server" style="padding-left:34px;"></div></td>' +
                        '</tr>' +
                        '<tr>' +
                        '    <td style="padding-left:5px;">' +
                        '        <div style="width:136px; display:inline-block">Report Group Name:</div>' +
                        '        <input id="ReportGroup" type="text" maxlength="40" style="width:230px;" list="ReportGroupList" />' +
                        '        *optional if not shared, required if shared.' +
                        '        <datalist id="ReportGroupList"></datalist>' +
                        '    </td>' +
                        '</tr>' +
                        '<tr>' +
                        '    <td style="padding-left:5px;">' +
                        '        <div style="width:136px; display:inline-block">Report Description:</div>' +
                        '        <input id="ReportDesc" type="text" maxlength="80" style="width:500px;" />' +
                        '    </td>' +
                        '</tr>' +
                        '<tr>' +
                        '    <td style="padding-top:15px;">' +
                        '        <input id="NoShare" name="share" type="radio" value="NoShare" /><label for="NoShare">No Sharing - report is private to me</label>' +
                        '    </td>' +
                        '</tr>' +
                        '<tr>' +
                        '    <td><input id="ShareAll" name="share" type="radio" value="ShareAll" /><label for="ShareAll">Share this report with everyone (group name required)</label></td>' +
                        '</tr>' +
                    '</table>' +
                '</div >' +
            '</div >');
        $div = $('#SaveReportDialog');
    }
    return $div;
}

ZpmReportBuilder.prototype.SaveReportDialog = function () {
	if (this.ReportParameters() == null) // verify no parm errors
		return;

	var $list = $('#ReportGroupList');
	$list.html("");
	this.$reportName.find('optgroup').each(function () {
		var option = document.createElement("OPTION");
		option.value = $(this).attr('label');
		if (option.value != "My Private Reports")
			$list.append(option);
	});

    var $div = this.GetSaveReportDialog();
	var rm = this.CurrentReportModel();

	if (rm == null || !this.CreatedByMe(rm)) { // new report
        $div.find('#ZpmSaveReportAdd')[0].checked = true;
		this.SaveReportDialogInfo(false, true)
		$div.find('.notNew').hide();
		$div.find('#NewName').val(rm == null ? "" : rm.Parms.ReportName);
		$div.find('#ReportGroup').val(rm == null ? "" : rm.Parms.ReportGroup);
		$div.find('#ReportDesc').val(rm == null ? "" : rm.Parms.ReportDescription);
		$div.find('#NoShare')[0].checked = true;
		$div.find('#ReportId').val("0");
	} else { // existing report
		var report = this.CurrentReportModel();
		$div.find('#ReportId').val(this.ReportId(rm));
        $div.find('#ZpmSaveReportUpdate')[0].checked = true;
		this.SaveReportDialogInfo(true, false)
		$div.find('.notNew').show();
		$div.find('.current-name').text(rm.Parms.ReportName);
		$div.find('#NewName, #ChangeName').val(rm.Parms.ReportName);
		$div.find('#ReportGroup').val(rm.Parms.ReportGroup);
        $div.find('#ReportDesc').val(rm.Parms.ReportDescription);
        $div.find('#' + rm.Parms.Share)[0].checked = true;
	}

	if (!$div.hasClass('ui-dialog-content')) {
		$div.dialog({
			autoOpen: false, modal: true, show: "fade", hide: "fade", width: 720,
			title: "SAVE REPORT",
			buttons: {
				'OK': function () {
                    var msg = document.zpmReportBuilder.SaveReport();
					if (msg != "")
						alert(msg);
				},
				'Cancel': function () {
					$(this).dialog("close");
				}
			}
		});
	}
	$div.dialog("open");
}

ZpmReportBuilder.prototype.GetFilterDateValue = function ($div) {
	var value = $div.find('.zpm-filter-date-type').val();
	switch (value) {
		case 'D':
			var dt = $div.find('.datepicker').val();
			value += '\t' + dt + '\t';
			break;
		default:
			value += '\t' + $div.find('.zpm-filter-date-relative input').val() + '\t' + $div.find('.zpm-filter-date-relative select').val();
			break;
	}
	return value;
}

ZpmReportBuilder.prototype.ReportParameters = function () {
	var data = {};
	var rm = this.CurrentReportModel();
	if (rm == null) {
		data.ReportGroup = "";
		data.ReportName = "Temp Report";
		data.ReportDescription = "";
	} else {
		data.ReportGroup = (rm.Parms.ReportGroup) ? rm.Parms.ReportGroup : "";
		data.ReportName = rm.Parms.ReportName;
		data.ReportDescription = rm.Parms.ReportDescription;
	}
	data.ReportTypes = [];
	for (var i = 0; i < this.report.ChosenColumnNames.length; i++) {
		var col = this.ReportColumnByName(this.report.ChosenColumnNames[i], this.report);
		if (col != null && !(col.ReportType === undefined)) {
			if (data.ReportTypes.indexOf(col.ReportType) == -1)
				data.ReportTypes.push(col.ReportType);
		}
	}
	data.ColumnNames = this.report.ChosenColumnNames;
	data.ColumnHeadings = [];
	for (var i = 0; i < data.ColumnNames.length; i++) {
		this.report.Columns.forEach(function (c) {
			if (c.Name == data.ColumnNames[i])
				data.ColumnHeadings.push(c.Heading);
		});
	}
    data.OrderBy = Chosen.prototype.get_chosen_order(this.$orderBy)  // this.GetChosenOrder(this.$orderBy);
    if (data.OrderBy == null)
        data.OrderBy = [];

    data.PdfOrientation = $('input[name=PdfOrientation]:checked').val();
	data.Filters = [];

	var filterType, condition, value, not, openParen, closeParen, id, AndOr;
	var filters = this.$reportOptions.find('.zpm-filter');
	var parenthesis = 0;
	for (var i = 0; i < filters.length; i++) {
		if (filters[i].innerHTML != "") { // skip empty filter options
			$div = $(filters[i]);
			var name = $div.attr('data-name');
			filterType = $div.attr('data-type');
			switch (filterType) {
				case "zpm-filter-condition-string":
					condition = $div.find('select').val();
					value = $($div.find('input')).val().trim();
                    break;

				case "zpm-filter-condition-integer":
					condition = $div.find('select').val();
					value = $($div.find('input')).val().trim();
					if (value != '') {
						if (zpm.GetInteger(value) == null) {
							$div.find('input').focus();
							alert("Invalid Number");
							return null;
						}
					}
                    break;

                case "zpm-filter-condition-number": ;
                    condition = $div.find('select').val();
                    value = $($div.find('input')).val().trim();
                    if (value != '') {
                        if (zpm.GetNumber(value) == null) {
                            $div.find('input').focus();
                            alert("Invalid Number");
                            return null;
                        }
                    }
                    break;

                case "zpm-filter-condition-bool":
                    condition = "EQ";
                    value = $div.find('select').val();
                    break;

                case "zpm-filter-condition-date":
					condition = $div.find('select').val();
					switch (condition) {
						case "DR":
							value = this.GetFilterDateValue($div.find('.zpm-filter-date-from'));
							value += '\t' + this.GetFilterDateValue($div.find('.zpm-filter-date-to'));
							if (value == "D\t\t\tD\t\t")
								continue; // empty
							break;
						case "IB":
						case "NB":
							value = "";
							break;
						default:
							value = this.GetFilterDateValue($div.find('.zpm-filter-date-from'));
							if (value == "D\t\t")
								continue;
							break;
					}
                    break;

				case 'zpm-filter-chosen-string':
					condition = "";
                    value = Chosen.prototype.get_chosen_order($div.find('.chosen-select')); // this.GetChosenOrder($div.find('.chosen-select'));
					if (value == null || value.length == 0)
						continue;
					value = value.join('\t');
                    break;

				case 'zpm-filter-chosen-integer':
					condition = "";
                    var value = Chosen.prototype.get_chosen_order($div.find('.chosen-select')); // this.GetChosenOrder($div.find('.chosen-select'));
					if (value == null || value.length == 0)
						continue;
					//value = zpm.StringArrayToInt(value);
					value = value.join('\t');
                    break;

				case "zpm-filter-string":
					condition = "";
					value = $div.find('input').val().trim();
					break;

				default:
					debugger;
					break;
			}

			var $tr = $div.closest('tr');
			if ($tr.length == 1) {
				id = ($tr.closest('table')[0].id == 'zpmFilterTable') ? "" : name;
				andOr = $tr.find('.zpm-filter-and-or a').text();
				not = $tr.find('.zpm-filter-not-cb');
				not = (not.length == 1 && not[0].checked) ? "NOT" : "";
				openParen = $tr.find('.zpm-filter-open-paren').text();
				parenthesis += openParen.length;
				closeParen = $tr.find('.zpm-filter-close-paren').text();
				parenthesis -= closeParen.length;
				data.Filters.push({ Id: id, Name: name, Type: filterType, AndOr: andOr, OpenParen: openParen, Not: not, Condition: condition, Value: value, CloseParen: closeParen });
			} else { // if not in a table
				data.Filters.push({ Id: name, Name: name, Type: filterType, AndOr: "AND", OpenParen: "", Not: "", Condition: "", Value: value, CloseParen: "" });
			}
			if (parenthesis < 0) {
				alert("Unbalanced group parenthesis, closing parenthesis without an open parenthesis on line " + ($tr[0].rowIndex + 1));
				return null;
			}
		}
	}
	if (parenthesis > 0) {
		alert("Unbalanced group parenthesis, missing closing parenthesis.");
		return null;
	}
	return data;
}

ZpmReportBuilder.prototype.SaveReportDialogInfo = function (showUpdate, showAdd) {
	var $d = $('#SaveReportDialog');
	if (showUpdate)
		$d.find('.update-info').show();
	else
		$d.find('.update-info').hide();
	if (showAdd)
		$d.find('.add-info').show();
	else
		$d.find('.add-info').hide();
}

ZpmReportBuilder.prototype.AndOrToggle = function (e) {
	$(e).text(($(e).text() == "AND") ? "OR" : "AND");
}

ZpmReportBuilder.prototype.GetZpmFilterMenu = function () {
    var $div = $('#ZpmFilterMenu');
    if ($div.length == 0) {
        $('body').append('<div id="ZpmFilterMenu" style="display:none">' +
            '    <ul id="ZpmFilterMenuUl" >' +
            '        <li id="ZpmFilterMenuRemove" onclick="document.zpmReportBuilder.ZpmFilterMenuAction(this)">Remove</li>' +
            '        <li id="ZpmFilterMenuInsertAbove" onclick="document.zpmReportBuilder.ZpmFilterMenuAction(this)">Insert above</li>' +
            '        <li id="ZpmFilterMenuInsertBelow" onclick="document.zpmReportBuilder.ZpmFilterMenuAction(this)">Insert below</li>' +
            '        <li id="ZpmFilterMenuOpenGroup" onclick="document.zpmReportBuilder.ZpmFilterMenuAction(this)">( Open group</li>' +
            '        <li id="ZpmFilterMenuCloseGroup" onclick="document.zpmReportBuilder.ZpmFilterMenuAction(this)">) Close group</li>' +
            '        <li id="ZpmFilterMenuRemoveGroup" onclick="document.zpmReportBuilder.ZpmFilterMenuAction(this)">() Remove group</li>' +
            '        <li id="ZpmFilterMenuRemoveOpenGroup" onclick="document.zpmReportBuilder.ZpmFilterMenuAction(this)">() Remove open group</li>' +
            '        <li id="ZpmFilterMenuRemoveCloseGroup" onclick="document.zpmReportBuilder.ZpmFilterMenuAction(this)">() Remove close group</li>' +
            '    </ul >' +
            '</div >');
        $div = $('#ZpmFilterMenu');
    }
    return $div;
}

ZpmReportBuilder.prototype.ZpmFilterMenu = function (e) {
    $div = this.GetZpmFilterMenu();
    $div[0].zpmFilterMenuClicked = e;
	if (!$div.hasClass('ui-dialog-content')) {
	    $div.dialog({
	        autoOpen: false,
	        modal: true,
	        show: "fade",
	        hide: "fade",
	        width: 170,
	        height: 140,
	        dialogClass: 'display-none',
	        open: function () {
	            overlayOpacityNormal = $('.ui-widget-overlay').css('opacity');
	            $('.ui-widget-overlay').css('opacity', 0.2);
	        },
	        beforeClose: function () {
	            $('.ui-widget-overlay').css('opacity', overlayOpacityNormal);
	        }
	    });
	}
	$div.dialog('option', 'position', { my: 'left', at: 'right', of: e });
	$div.find(".ui-dialog-titlebar").hide();
	$div.dialog("open");
	$('.ui-widget-overlay').click(function () {
		$('#ZpmFilterMenu').dialog("close");
	});
}


ZpmReportBuilder.prototype.ZpmFilterMenuAction = function (li) {
	$div = $('#ZpmFilterMenu');
    $tr = $($div[0].zpmFilterMenuClicked).closest('tr');
	var tbl = $tr.closest('table')[0];
	switch (li.id) {
	    case "ZpmFilterMenuRemove":
	        this.RemoveAutoAddedColumn($tr.find('.zpm-filter-select'));
			if (this.$filterTable.find('tr').length == 1) {
                $tr[0].outerHTML = this.FilterTableRowHtml();
			} else {
				$tr.remove();
			}
			$(tbl.rows[0]).find('.zpm-filter-and-or a').hide().text("AND"); // force first one to AND
			break;
		case "ZpmFilterMenuInsertAbove":
			if ($tr[0].rowIndex == 0) {
				$tr.find('.zpm-filter-and-or a').show();
                $tr.before(this.FilterTableRowHtml());
				$(tbl.rows[0]).find('.zpm-filter-and-or a').hide();
			} else
                $tr.before(this.FilterTableRowHtml());
			break;
		case "ZpmFilterMenuInsertBelow":
            $tr.after(this.FilterTableRowHtml());
			break;
		case "ZpmFilterMenuOpenGroup":
			var $op = $tr.find('.zpm-filter-open-paren');
			$op.text($op.text() + "(");
			break;
		case "ZpmFilterMenuCloseGroup":
			var $cp = $tr.find('.zpm-filter-close-paren');
			$cp.text($cp.text() + ")");
			break;
		case "ZpmFilterMenuRemoveGroup":
			var $op = $tr.find('.zpm-filter-open-paren');
			if ($op.text() != "")
				$op.text($op.text().substring(1));
			var $cp = $tr.find('.zpm-filter-close-paren');
			if ($cp.text() != "")
				$cp.text($cp.text().substring(1));
			break;
		case "ZpmFilterMenuRemoveOpenGroup":
			var $op = $tr.find('.zpm-filter-open-paren');
			if ($op.text() != "")
				$op.text($op.text().substring(1));
			break;
		case "ZpmFilterMenuRemoveCloseGroup":
			var $cp = $tr.find('.zpm-filter-close-paren');
			if ($cp.text() != "")
				$cp.text($cp.text().substring(1));
			break;
	}
	$div.dialog("close");
}

ZpmReportBuilder.prototype.GetReports = function () {
	this.ServerGetReports(function (data) {
		if (data == null)
            alert("Action " + document.zpmReportBuilder.urlBase + "/GetReports failed");
		else
            document.zpmReportBuilder.SetReportNames(data);
	});
}

ZpmReportBuilder.prototype.RunReportToExcel = function () {
	if ((data = this.ReportParameters()) == null)
        return;
    zpm.AjaxCallbackTimer("RunReportToExcel", 300);
    this.ServerRunReportToExcel(document.zpmReportBuilder.RunReportParameters(data), 
		function (reportHandle) {
            window.open(document.zpmReportBuilder.urlBase +'/ExcelDownload?reportHandle=' + reportHandle, "_blank");
		}
	);
}

ZpmReportBuilder.prototype.RunReportToPdf = function () {
	if ((data = this.ReportParameters()) == null)
		return;
    zpm.AjaxCallbackTimer("RunReportToPdf", 1200);
    this.ServerRunReportToPdf(document.zpmReportBuilder.RunReportParameters(data),
		function (reportHandle) {
            window.open(document.zpmReportBuilder.urlBase + '/PdfDownload/' + data.ReportName + '?reportHandle=' + reportHandle, "_blank");
		}
	);
}

ZpmReportBuilder.prototype.RunReportToScreen = function () {
	if ((data = this.ReportParameters()) == null)
		return;
    zpm.AjaxCallbackTimer("RunReportToScreen", 300);
    this.ServerRunReportToScreen(document.zpmReportBuilder.RunReportParameters(data), function (data) { document.zpmReportBuilder.RunReportCallback(data); })
}

ZpmReportBuilder.prototype.RunReportCallback = function (data) {
	if (data == null) {
		this.$message.text('');
        alert("RunReportCallback failed");
	} else if (typeof data == 'string') {
		this.$message.text(data);
	} else {
		var rowTemplate = "";
		var textReplace = [];
		this.ReportHeading(this.$reportTable, this.report);
		this.$message.text(data.Message);
		for (var x = 0; x < this.report.ChosenColumnNames.length; x++) {
			var col = this.ReportColumnByName(this.report.ChosenColumnNames[x], this.report);
			rowTemplate += col.TdHtml;
			textReplace.push(col.TextReplace);
		}
		rowTemplate = this.report.trHtml.replace("</tr>", rowTemplate + "</tr>");
		var altRow = false;
		var html = "";
		for (var i = 0; i < data.Rows.length; i++) {
            var rowData = data.Rows[i].split('\t');
            html += this.ReportRowFormat(textReplace, altRow, rowData, rowTemplate);
            altRow = !altRow;
        }
		var id = this.$reportTable[0].id;
		this.$reportTable.find('tbody')[0].outerHTML = "<tbody>" + html + "</tbody>";   // faster than .html(html) when replacing existing report
		this.$reportTable = $('#' + id); // reset to new element
		$('.zpm-fixed-heading-container').show();
		zpm.FixedHeadingAlign(this.$reportTable);
		this.ReportTableResize();
	}
}

ZpmReportBuilder.prototype.ReportRowFormat = function (textReplace, altRow, rowData, trHtml) {
    if (!altRow)
        trHtml = trHtml.replace("altrow", "");
    for (var x = 0; x < this.report.ChosenColumnNames.length; x++) {
        trHtml = trHtml.replace(textReplace[x], rowData[x]);
    }
    return trHtml;
}

ZpmReportBuilder.prototype.SaveReport = function () {
	var data;
	var $dialog = $('#SaveReportDialog');
	var action = $dialog.find('input[name=action]:checked').val();
    if (action == "Delete") {
		data = {};
		data.ReportName = $dialog.find('.current-name').text();

	} else {
		if ((data = this.ReportParameters(data)) == null)
			return;
        if (action == 'Update') {
			data.ReportName = $dialog.find('#ChangeName').val().trim();
			if ((msg = zpm.ValidFileName(data.ReportName)) != "") {
				$dialog.find('#NewName').focus();
				return msg;
			}
		} else { // Add
			data.ReportName = $dialog.find('#NewName').val().trim();
			if ((msg = zpm.ValidFileName(data.ReportName)) != "") {
				$dialog.find('#NewName').focus();
				return msg;
			}
		}
        data.ReportGroup = $dialog.find('#ReportGroup').val().trim();
		data.ReportDescription = $dialog.find('#ReportDesc').val().trim();
		if (data.ReportDescription == "") {
			$dialog.find('#ReportDesc').focus();
			return "Report description cannot be blank";
		}
		data.Share = $dialog.find('input[name=share]:checked').val();
		if (data.Share!="NoShare" && data.ReportGroup == "") {
		    $dialog.find('#ReportGroup').focus();
		    return "Report group is required for shared reports. ";
		}
	}
	data.ReportId = parseInt($dialog.find('#ReportId').val());
	this.ServerSaveReport(action, data, function (result) {
		if (typeof result == 'string')
			alert(result);
		else {
			$('#SaveReportDialog').dialog("close");
            document.zpmReportBuilder.SetReportNames(result);
		}
	});
	return "";
}

ZpmReportBuilder.prototype.ServerSaveReport = function (action, data, callback) {
	$.ajax({
        url: document.zpmReportBuilder.urlBase + "/SaveReport",
		type: "POST",
		data: {
            action: action, ReportId: data.ReportId, ReportGroup: data.ReportGroup, ReportName: data.ReportName, ReportDescription: data.ReportDescription, Share: data.Share, ColumnNames: data.ColumnNames,
			OrderBy: data.OrderBy, PdfOrientation: data.PdfOrientation, Filters: data.Filters
		},
		success: callback,
        error: function (err) { Zpm.prototype.ErrorDialog(err.responseText, 800, 1000); }
	});
}

ZpmReportBuilder.prototype.SetReportDefault = function (action) {
    var idx = "~";
    var val = 0;
	if (action == 'set') {
		idx = this.$reportName.val();
		switch (idx) {
			case '':
		    case '+':
		        return; // shouldn't happen
		    default:
		        val = this.ReportId(this.savedReports.Reports[parseInt(idx)]); break;
		}
	}

	this.ServerSetReportDefault(val,
		function (result) {
		    if (typeof result == 'string')
		        alert(result);
		    else {
                document.zpmReportBuilder.savedReports = result;
                document.zpmReportBuilder.$reportName.find("option").each(function () { // update report name list
		            if (this.value == idx) {
		                if (this.textContent[this.textContent.length - 1] != "*")
		                    $(this).text(this.textContent + "*");
		            } else {
		                if (this.textContent[this.textContent.length - 1] == "*")
		                    $(this).text(this.textContent.substring(0, this.textContent.length - 1)); // remove *
		            }
		        });
		    }
		}
	);
}

// ==== filter templates ===============




// ==== Frequently Overridden (customized) =======
ZpmReportBuilder.prototype.CreatedByMe = function (report) {
    throw "CreatedByMe must be overridden.  Returns bool - true/false."
}

ZpmReportBuilder.prototype.ReportId = function (report) {
    // override this if not using the Zpm Setting database table.
    return report.SettingId; // id of report record in the database
}

// ==== Server Calls ========================================
ZpmReportBuilder.prototype.ServerGetReports = function (callback) {
    zpm.AjaxCallbackTimer(this.urlBase + "/GetReports");
	$.ajax({
		url: this.urlBase + "/GetReports",
		type: "POST",
		success: callback,
		error: function (err) { Zpm.prototype.ErrorDialog(err.responseText, 800, 1000); }
	});
}

ZpmReportBuilder.prototype.ServerGetFilterDate = function (type, value1, value2, callBack) {
	$.ajax({
        url: this.urlBase + "/GetFilterDate", type: "POST", data: { type: type, value1: value1, value2: value2 },
		success: callBack,
        error: function (err) { Zpm.prototype.ErrorDialog(err.responseText, 800, 1000); }
	});
}

ZpmReportBuilder.prototype.ServerRunReportToScreen = function (data, callback) {
	$.ajax({
		url: this.urlBase + "/RunReportToScreen", type: "POST", data: data,
		success: callback,
        error: function (err) { Zpm.prototype.ErrorDialog(err.responseText, 800, 1000); }
	});
}

ZpmReportBuilder.prototype.ServerRunReportToExcel = function (data, callback) {
	$.ajax({
        url: this.urlBase + "/RunReportToExcel", type: "POST", data: data,
		success: callback,
        error: function (err) { Zpm.prototype.ErrorDialog(err.responseText, 800, 1000); }
	});
}

ZpmReportBuilder.prototype.ServerRunReportToPdf = function (data, callback) {
	$.ajax({
		url: this.urlBase + "/RunReportToPdf", type: "POST", data: data,
		success: callback,
        error: function (err) { Zpm.prototype.ErrorDialog(err.responseText, 800, 1000); }
	});
}

ZpmReportBuilder.prototype.ServerSetReportDefault = function (val, callback) {
	$.ajax({
        url: this.urlBase + "/SetReportDefault", type: "POST", data: { reportId: val },
		success: callback,
        error: function (err) { Zpm.prototype.ErrorDialog(err.responseText, 800, 1000); }
	});
}
