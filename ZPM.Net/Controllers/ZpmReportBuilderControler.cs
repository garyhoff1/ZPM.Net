/*
Copyright(c) 2018 Zpm Software Inc, ZpmSoftware.com

The Code Project Open License (CPOL) governs Your use of ZPM.Net.
This License is intended to allow developers to use the Source Code
and Executable Files provided as part of the Work in any application in any form.

The full agremeent is available at: https://www.codeproject.com/info/cpol10.aspx
*/

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Microsoft.AspNet.Identity;
using System.Text;
using System.Data;
using System.Data.SqlClient;
//using System.MySqlClient;
using System.Web.Script.Serialization;
using System.ComponentModel.DataAnnotations;
using System.IO;
using PdfSharp.Pdf;
using PdfSharp.Drawing;
using MigraDoc.DocumentObjectModel;
using MigraDoc.Rendering;
using MigraDoc.DocumentObjectModel.Tables;
using System.Data.Common;

namespace ZPM.Net.Controllers
{
    [Authorize]
    public abstract class ZpmReportBuilderController : ZpmController
    {
        protected int MaxBrowserRows;
        protected string SettingsCategory_Reports;

        public ZpmReportBuilderController(string settingsCategoryReports, int maxBrowserRows)
        {
            SettingsCategory_Reports = settingsCategoryReports;
            MaxBrowserRows = maxBrowserRows;
        }

        protected virtual string BoolToString(bool value)
        {
            return (value) ? "YES" : "";
        }

        protected ActionResult GetReports(int selectedReportId)
        {
            var userId = User.Identity.GetUserId<int>().ToString();
            var userKey = "|" + userId;
            using (var db = NewDbContext())
            {
                var reports = db.Settings.Where(r => r.Category == SettingsCategory_Reports && (r.Key.Contains("|Share") || r.Key.Contains(userKey)))
                                         .Join(db.AspNetUsers, s=> s.CreatedByUserId, u=> u.Id, (s, u) => new
                                            {
                                                s.SettingId,
                                                s.Category,
                                                s.Key,
                                                s.Value,
                                                s.CreatedByUserId,
                                                s.ChangedByUserId,
                                                s.CreatedDttm,
                                                s.ChangedDttm,
                                                s.tmStamp,
                                                CreatedByUserInitials = u.UserInitials
                                            })
                                         .OrderBy(r => r.Key).ToList();

                var dflt = db.Settings.Where(r => r.Category == SettingsCategory_Reports + "Default" && r.Key == userId).SingleOrDefault();
                var defaultReportId = (dflt == null) ? 0 : int.Parse(dflt.Value);
                return Json(new { Reports = reports, DefaultReport = defaultReportId, SelectedtReport = selectedReportId });
            }
        }

        [HttpPost]
        public ActionResult GetReports()
        {

            return GetReports(0);
        }


        public class Filter
        {
            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string Id { get; set; }
            public string Name { get; set; }
            public string Type { get; set; }
            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string AndOr { get; set; }
            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string OpenParen { get; set; }
            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string Not { get; set; }
            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string Condition { get; set; }
            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string Value { get; set; }
            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string CloseParen { get; set; }
        }

        protected class FilterCondition<T>
        {
            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string Sequence { get; set; }
            public string Name { get; set; }
            public string Condition { get; set; }
            public T Value { get; set; }
            public bool Exclude { get; set; }
        }

        protected class FilterArray<T>
        {
            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string Sequence { get; set; }
            public string Name { get; set; }
            public T[] Value { get; set; }
        }

        public class ReportParameters
        {
            public int ReportId { get; set; }
            public string ReportGroup { get; set; }
            public string ReportName { get; set; }
            public string ReportDescription { get; set; }
            public string Share { get; set; }
            public string PdfOrientation { get; set; }
            public string[] ColumnNames { get; set; }
            public string[] ColumnHeadings { get; set; }
            public string[] OrderBy { get; set; }
            public Filter[] Filters { get; set; }
        }


        [HttpPost]
        public ActionResult SaveReport(string action, ReportParameters parms)
        {
            var userId = User.Identity.GetUserId<int>();
            int selectedtReportId = 0;
            try
            {
                string strParms = new JavaScriptSerializer().Serialize(parms);
                using (var db = NewDbContext())
                {
                    ZPM.NetDb.Models.Setting setting = null;

                    if (action != "Add")
                        setting = db.Settings.Where(r => r.SettingId == parms.ReportId).Single();

                    string key = parms.ReportName;
                    if (action != "Delete")
                    {
                        if (parms.Share == "NoShare")
                            key += "|" + userId.ToString();  // allow dupldate names per user
                        else
                            key += "|Share";
                    }

                    switch (action)
                    {
                        case "Add":
                            setting = new ZPM.NetDb.Models.Setting() { Category = SettingsCategory_Reports, Key = key };
                            setting.Value = strParms;
                            setting.CreatedByUserId = setting.ChangedByUserId = userId;
                            setting.CreatedDttm = setting.ChangedDttm = DateTime.Now;
                            db.Settings.Add(setting);
                            db.SaveChanges();
                            selectedtReportId = setting.SettingId;
                            break;

                        case "Update":
                            if (setting.Value != strParms || setting.Key != key) // if settings changed
                            {
                                setting.Key = key;
                                setting.Value = strParms;
                                setting.ChangedByUserId = userId;
                                setting.ChangedDttm = DateTime.Now;
                                db.SaveChanges();
                            }
                            selectedtReportId = setting.SettingId;
                            break;

                        case "Delete":
                            if (setting != null)  // if found, delete it
                            {
                                db.Settings.Remove(setting);
                                db.SaveChanges();
                            }
                            break;
                    }
                }
            }
            catch (Exception ex)
            {
                ex = Zpm.GetInnerException(ex);
                if (ex.Message.ToUpper().Contains("DUPLICATE"))
                    return Json("Cannot add duplicate Report Name");
                throw ex;
            }
            return GetReports(selectedtReportId);
        }

        [HttpPost]
        public ActionResult SetReportDefault(int reportId)
        {
            var userId = User.Identity.GetUserId<int>();

            using (var db = NewDbContext())
            {
                var setting = db.Settings.Where(r => r.Category == SettingsCategory_Reports + "Default" && r.Key == userId.ToString()).SingleOrDefault();
                if (setting == null)
                {
                    if (reportId != 0)
                    {
                        setting = new ZPM.NetDb.Models.Setting()
                        {
                            Category = SettingsCategory_Reports + "Default",
                            Key = userId.ToString(),
                            CreatedByUserId = userId,
                            ChangedByUserId = userId,
                        };
                        setting.CreatedDttm = setting.ChangedDttm = DateTime.Now;
                        setting.Value = reportId.ToString();
                        db.Settings.Add(setting);
                        db.SaveChanges();
                    }
                }
                else if (reportId == 0)
                {
                    db.Settings.Remove(setting);
                    db.SaveChanges();
                }
                else
                {
                    setting.ChangedByUserId = userId;
                    setting.ChangedDttm = DateTime.Now;
                    setting.Value = reportId.ToString();
                    db.SaveChanges();
                }

            }
            return GetReports(reportId);
        }

        private DateTime CalcDate(string type, string value1, string value2)
        { // used for debugging - remove in future
            var dt = CalculateDate(type, value1, value2);
            return dt;
        }

        [HttpPost]
        public ActionResult GetFilterDate(string type, string value1, string value2)
        {
            return Json(Zpm.FormatDate(CalculateDate(type, value1, value2)));
        }

        private DateTime CalculateDate(string type, string value1, string value2)
        {
            DateTime baseDate = DateTime.MinValue;
            switch (type)
            {
                case "D": return Convert.ToDateTime(value1);
                case "T": baseDate = DateTime.Today; break;
                case "MS": baseDate = DateTime.Today.AddDays(1 - DateTime.Today.Day); break; // month start
                case "ME": // month end
                    baseDate = DateTime.Today.AddMonths(1);
                    baseDate = baseDate.AddDays(-baseDate.Day);
                    break;
                case "YS": baseDate = new DateTime(DateTime.Today.Year, 1, 1); break;  // year start
                case "YE": baseDate = new DateTime(DateTime.Today.Year, 12, 31); break;  // year end
            }

            int offset = Convert.ToInt32(value1.Replace("+", ""));
            switch (value2)
            {
                case "D": return baseDate.AddDays(offset);
                case "W": return baseDate.AddDays(offset * 7);
                case "M": return baseDate.AddMonths(offset);
                case "Y": return baseDate.AddYears(offset);
            }
            throw new Exception("Unexpected date parameter: " + value2);
        }

        protected string SQlAddParameter<T>(T value, IDbCommand cmd, ref int parmCount)
        {
            var parm = "@p" + (parmCount++).ToString();

            if (cmd is SqlCommand)
            {
                cmd.Parameters.Add(new SqlParameter(parm, value));
            }
            else
            {
                throw new Exception("Database type not supported");
            }
            return parm;
        }

        protected string SQlAddDateParameter(string type, string value1, string value2, IDbCommand cmd, ref int parmCount)
        {
            var parm = "@p" + (parmCount++).ToString();
            if (cmd is SqlCommand)
            {
                cmd.Parameters.Add(new SqlParameter(parm, CalcDate(type, value1, value2)));
            }
            else
            {
                throw new Exception("Database type not supported");
            }
            return parm;
        }

        protected class RunReportResult
        {
            public string Message { get; set; }
            public object Rows { get; set; }
        }

        protected abstract IDbCommand ReportCommand(ReportParameters parms);

        [HttpPost]
        public ActionResult RunReportToScreen(ReportParameters parms)
        {
            using (var db = NewDbContext())
            {
                IDbCommand cmd;

                try
                {
                    cmd = ReportCommand(parms);
                }
                catch (Exception ex)
                {
                    return Json(ex.Message);
                }
                db.Database.Connection.Open();
                cmd.Connection = db.Database.Connection;

                var rows = new List<string>();

                using (var reader = cmd.ExecuteReader())
                {
                    var row = new StringBuilder();
                    while (reader.Read())
                    {
                        row.Clear();
                        try
                        {
                            for (int i = 0; i < parms.ColumnNames.Length; i++)
                            {
                                switch (reader[i].GetType().Name)
                                {
                                    case "Boolean":
                                        row.Append(BoolToString((bool)reader[i]) + "\t"); // tab delimited fields
                                        break;

                                    case "DateTime":
                                        row.Append(((DateTime)reader[i]).ToString("MM/dd/yyyy") + "\t"); // tab delimited fields
                                        break;

                                    default:
                                        row.Append(reader[i].ToString().Replace('\t', ' ') + "\t"); // tab delimited fields
                                        break;
                                }
                            }
                            rows.Add(row.ToString(0, row.Length - 1).Replace("\n", ""));
                        }
                        catch (Exception ex)
                        {
                            throw;
                        }
                    }
                }
                cmd.Dispose();
                var result = new RunReportResult();
                if (rows.Count > MaxBrowserRows)
                {
                    result.Message = "Only " + MaxBrowserRows.ToString("N0") + " rows are displayed. The query returned " + rows.Count.ToString("N0") + " rows. Change filters to return less than " + MaxBrowserRows.ToString("N0") + " rows.";
                    result.Rows = rows.Take(MaxBrowserRows).ToList();
                }
                else
                {
                    result.Message = "The query returned " + rows.Count.ToString("N0") + " rows."; // + cmd.CommandText;
                    result.Rows = rows;
                }

                return new JsonResult()
                {
                    Data = result,
                    MaxJsonLength = Int32.MaxValue
                };
            }
        }

        protected virtual string WhereColumnName(Filter f)
        {
            return DbColumnNameEscape(f.Name);
        }

        protected virtual string WhereSql(ReportParameters parms, IDbCommand cmd)
        {
            if (parms.Filters == null)
                return "";

            int parmCount = 0;
            StringBuilder sql = new StringBuilder(" WHERE");
            foreach (var f in parms.Filters)
            {
                sql.Append(" " + f.AndOr + " " + f.OpenParen + f.Not + " ");

                switch (f.Type)
                {
                    case "zpm-filter-condition-string":
                        sql.Append(WhereColumnName(f));
                        switch (f.Condition)
                        {
                            case "SW": sql.Append(" LIKE " + SQlAddParameter(f.Value + "%", cmd, ref parmCount)); break; // starts with
                            case "EQ": sql.Append("=" + SQlAddParameter(f.Value, cmd, ref parmCount)); break;  // equal
                            case "CO": sql.Append(" LIKE " + SQlAddParameter("%" + f.Value + "%", cmd, ref parmCount)); break; // contains
                            case "GT": sql.Append(">" + SQlAddParameter(f.Value, cmd, ref parmCount)); break;
                            case "GE": sql.Append(">=" + SQlAddParameter(f.Value, cmd, ref parmCount)); break;
                            case "LT": sql.Append("<" + SQlAddParameter(f.Value, cmd, ref parmCount)); break;
                            case "LE": sql.Append("<=" + SQlAddParameter(f.Value, cmd, ref parmCount)); break;
                            default:
                                throw new Exception("unexpected string condition '" + f.Name + "' - '" + f.Condition + "'");
                        }
                        break;

                    case "zpm-filter-condition-integer":
                        sql.Append(WhereColumnName(f));
                        switch (f.Condition)
                        {
                            case "EQ": sql.Append("=" + SQlAddParameter(int.Parse(f.Value), cmd, ref parmCount)); break;  // equal
                            case "GT": sql.Append(">" + SQlAddParameter(int.Parse(f.Value), cmd, ref parmCount)); break;
                            case "GE": sql.Append(">=" + SQlAddParameter(int.Parse(f.Value), cmd, ref parmCount)); break;
                            case "LT": sql.Append("<" + SQlAddParameter(int.Parse(f.Value), cmd, ref parmCount)); break;
                            case "LE": sql.Append("<=" + SQlAddParameter(int.Parse(f.Value), cmd, ref parmCount)); break;
                            default:
                                throw new Exception("unexpected integer condition '" + f.Name + "' - '" + f.Condition + "'");
                        }
                        break;

                    case "zpm-filter-condition-number":
                        sql.Append(WhereColumnName(f));
                        switch (f.Condition)
                        {
                            case "EQ": sql.Append("=" + SQlAddParameter(float.Parse(f.Value), cmd, ref parmCount)); break;  // equal
                            case "GT": sql.Append(">" + SQlAddParameter(float.Parse(f.Value), cmd, ref parmCount)); break;
                            case "GE": sql.Append(">=" + SQlAddParameter(float.Parse(f.Value), cmd, ref parmCount)); break;
                            case "LT": sql.Append("<" + SQlAddParameter(float.Parse(f.Value), cmd, ref parmCount)); break;
                            case "LE": sql.Append("<=" + SQlAddParameter(float.Parse(f.Value), cmd, ref parmCount)); break;
                            default:
                                throw new Exception("unexpected number condition '" + f.Name + "' - '" + f.Condition + "'");
                        }
                        break;

                    case "zpm-filter-condition-bool":
                        sql.Append(WhereColumnName(f) + (f.Value == "1" ? "=1" : "=0"));
                        break;

                    case "zpm-filter-condition-date":
                        var values = f.Value.Split('\t');
                        sql.Append(WhereColumnName(f));
                        switch (f.Condition)
                        {
                            case "DR":
                                if (!f.Value.Contains("D\t\t"))
                                {
                                    sql.Append(" BETWEEN " + SQlAddDateParameter(values[0], values[1], values[2], cmd, ref parmCount));
                                    sql.Append(" AND " + SQlAddDateParameter(values[3], values[4], values[5], cmd, ref parmCount));
                                }
                                else if (!f.Value.StartsWith("D\t\t"))
                                    sql.Append(">=" + SQlAddDateParameter(values[0], values[1], values[2], cmd, ref parmCount));
                                else
                                    sql.Append("<=" + SQlAddDateParameter(values[3], values[4], values[5], cmd, ref parmCount));
                                break;
                            case "IB": sql.Append("IS NULL"); break;
                            case "NB": sql.Append("IS NOT NULL"); break;
                            case "EQ": sql.Append("=" + SQlAddDateParameter(values[0], values[1], values[2], cmd, ref parmCount)); break;
                            case "GT": sql.Append(">" + SQlAddDateParameter(values[0], values[1], values[2], cmd, ref parmCount)); break;
                            case "GE": sql.Append(">=" + SQlAddDateParameter(values[0], values[1], values[2], cmd, ref parmCount)); break;
                            case "LT": sql.Append("<" + SQlAddDateParameter(values[0], values[1], values[2], cmd, ref parmCount)); break;
                            case "LE": sql.Append("<=" + SQlAddDateParameter(values[0], values[1], values[2], cmd, ref parmCount)); break;
                            default:
                                throw new Exception("unexpected integer condition '" + f.Name + "' - '" + f.Condition + "'");
                        }
                        break;
                    case "zpm-filter-chosen-string":
                        sql.Append(WhereColumnName(f) + " in ('" + String.Join("','", f.Value.Split('\t')) + "')");
                        break;
                    case "zpm-filter-chosen-integer":
                        sql.Append(WhereColumnName(f) + " in (" + String.Join(",", f.Value.Split('\t')) + ")");
                        break;
                    //case "zpm-filter-string":
                    //    break;

                    default: // custom filter, child class needs to handle
                        sql.Append(WhereSqlForCustomFilter(f, parms, cmd, ref parmCount));
                        break;
                }
                sql.Append(f.CloseParen);
            }
            sql = sql.Replace("WHERE AND", "WHERE");
            return sql.ToString();
        }

        protected virtual string WhereSqlForCustomFilter(Filter f, ReportParameters parms, IDbCommand cmd, ref int parmCount)
        {
            throw new Exception("Handler for filter type '" + f.Name + "' not implemented.");
        }

        protected virtual string OrderBySql(ReportParameters parms)
        {
            if (parms.OrderBy == null)
                return "";

            StringBuilder sql = new StringBuilder(" ORDER BY ");
            for (int i = 0; i < parms.OrderBy.Length; i++)
                sql.Append( DbColumnNameEscape(parms.OrderBy[i]) + ",");
            return sql.ToString().TrimEnd(',');
        }


        [HttpPost]
        public virtual ActionResult RunReportToExcel(ReportParameters parms) {
            using (var db = NewDbContext())
            {
                IDbCommand cmd;
                try
                {
                    cmd = ReportCommand(parms);
                }
                catch (Exception ex)
                {
                    throw;
                }
                db.Database.Connection.Open();
                cmd.Connection = db.Database.Connection;
                OfficeOpenXml.ExcelPackage package = new OfficeOpenXml.ExcelPackage();
                OfficeOpenXml.ExcelWorksheet sheet = package.Workbook.Worksheets.Add("sheet1");

                var header = package.Workbook.Styles.CreateNamedStyle("header");
                header.Style.Font.Bold = true;
                header.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                header.Style.Fill.BackgroundColor.SetColor(System.Drawing.ColorTranslator.FromHtml("#4b6c9e"));
                header.Style.Font.Color.SetColor(System.Drawing.ColorTranslator.FromHtml("#ffffff"));

                var altrow = package.Workbook.Styles.CreateNamedStyle("altrow");
                altrow.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                altrow.Style.Fill.BackgroundColor.SetColor(System.Drawing.ColorTranslator.FromHtml("#99CCFF"));

                var dateFmt = package.Workbook.Styles.CreateNamedStyle("date");
                dateFmt.Style.Numberformat.Format = "mm/dd/yyyy";
                dateFmt.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;

                var boolFmt = package.Workbook.Styles.CreateNamedStyle("bool");
                boolFmt.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;

                sheet.Cells[1, 1, 1, parms.ColumnNames.Length].StyleName = "header";
                for (int x = 1; x <= parms.ColumnNames.Length; x++)
                {
                    ExcelHeadingFormat(sheet, x, parms.ColumnNames[x - 1]);
                    sheet.Cells[1, x].Value = parms.ColumnHeadings[x - 1];
                    //if (parms.ColumnNames[x - 1].Contains("Date") || parms.ColumnNames[x - 1].Contains("Dttm"))
                    //    sheet.Column(x).StyleName = "date";
                }

                int row = 1;
                int numFormatCnt = 0;
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        try
                        {
                            row++;
                            for (int i = 0; i < parms.ColumnNames.Length; i++)
                            {
                                switch (reader[i].GetType().Name)
                                {
                                    case "Boolean":
                                        if (row == 2) // first data row
                                            sheet.Column(i+1).StyleName = "bool";
                                        sheet.Cells[row, i + 1].Value = BoolToString((bool)reader[i]);
                                        break;

                                    case "DateTime":
                                        if (row == 2)
                                            sheet.Column(i + 1).StyleName = "date";
                                        sheet.Cells[row, i + 1].Value = reader[i];
                                        break;

                                    case "Decimal":
                                        if (row == 2)
                                        {
                                            var numStr = reader[i].ToString();
                                            var dpos = numStr.IndexOf(".");
                                            var numFmtName = "num" + (++numFormatCnt).ToString();
                                            var numFmt = package.Workbook.Styles.CreateNamedStyle(numFmtName);
                                            if (dpos != -1)
                                                numFmt.Style.Numberformat.Format = "#,##0" + ".".PadRight(numStr.Length - dpos, '0');
                                            numFmt.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Right;
                                            sheet.Column(i + 1).StyleName = numFmtName;
                                        }
                                        sheet.Cells[row, i + 1].Value = reader[i];
                                        break;

                                    default:
                                        sheet.Cells[row, i + 1].Value = reader[i];
                                        break;
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            throw;
                        }
                    }
                }
                cmd.Dispose();

                for (int x = 1; x <= parms.ColumnNames.Length; x++)
                    sheet.Column(x).AutoFit();
                sheet.View.FreezePanes(2, 1);

                string reportHandle = Guid.NewGuid().ToString();
                using (System.IO.MemoryStream memoryStreamXlsx = new System.IO.MemoryStream())
                {
                    package.SaveAs(memoryStreamXlsx);
                    TempData[reportHandle] = memoryStreamXlsx.ToArray();
                }
                //LogMessage("HttpPost RunReportToExcel reportHandle=" + reportHandle);
                return Json(reportHandle);
            };

        }

        protected virtual void ExcelHeadingFormat(OfficeOpenXml.ExcelWorksheet sheet, int column, string columnName)
        {
            return; // default is no formatting
        }

        [HttpGet]
        public virtual ActionResult ExcelDownload(string reportHandle)
        {
            var data = (byte[])TempData[reportHandle];
            //LogMessage("HttpGet ExcelDownload reportHandle=" + reportHandle + ", Length=" + data.Length.ToString());
            return File(data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        }

        [HttpPost]
        public virtual ActionResult RunReportToPdf(ReportParameters parms)
        {
            using (var db = NewDbContext())
            {
                IDbCommand cmd;
                double fontSize = 9;

                try
                {
                    cmd = ReportCommand(parms);
                }
                catch (Exception ex)
                {
                    throw;
                }
                db.Database.Connection.Open();
                cmd.Connection = (IDbConnection)db.Database.Connection;

                PdfDocument pdfDocument = new PdfDocument();
                pdfDocument.Info.Title = parms.ReportName;
                pdfDocument.Info.Author = User.Identity.GetUserName();
                pdfDocument.Info.Subject = parms.ReportDescription;
                pdfDocument.Info.Keywords = "";
                PdfPage page = pdfDocument.AddPage();
                page.Size = PdfSharp.PageSize.Letter;

                Document doc = new Document();
                Section sec = doc.AddSection();
                sec.PageSetup.PageFormat = PageFormat.Letter;
                sec.PageSetup.StartingNumber = 1;
                sec.PageSetup.RightMargin = ".25in";
                sec.PageSetup.LeftMargin = ".25in";
                sec.PageSetup.TopMargin = ".75in";
                sec.PageSetup.BottomMargin = ".25in";
                // 72 units per inch
                Style style = doc.Styles["Normal"];
                style.Font.Name = "Verdana";
                page.Orientation = (parms.PdfOrientation == "L") ? PdfSharp.PageOrientation.Landscape : PdfSharp.PageOrientation.Portrait;
                sec.PageSetup.Orientation = (parms.PdfOrientation == "L") ? Orientation.Landscape : Orientation.Portrait;

                double[] columnWidth = CalculateColumnWidths(parms, cmd, page, fontSize);
                double availWidth = page.Width.Point - sec.PageSetup.RightMargin.Point - sec.PageSetup.LeftMargin.Point - columnWidth.Length * 4;

                if (columnWidth.Sum() > availWidth)
                {
                    //page.Orientation = PdfSharp.PageOrientation.Landscape;
                    //sec.PageSetup.Orientation = Orientation.Landscape;
                    availWidth = page.Width.Point - sec.PageSetup.RightMargin.Point - sec.PageSetup.LeftMargin.Point - columnWidth.Length * 4;
                    while (columnWidth.Sum() > availWidth && fontSize > 5)
                    {
                        fontSize = fontSize - 1;
                        columnWidth = CalculateColumnWidths(parms, cmd, page, fontSize);
                    }
                }
                var blankCol = Array.FindIndex(parms.ColumnNames, c => c.Equals("blank"));
                if (blankCol >=0)
                {
                    double unused = availWidth - columnWidth.Sum();
                    columnWidth[blankCol] += unused;
                }

                var titleFont = new MigraDoc.DocumentObjectModel.Font("Verdana", 15);
                titleFont.Bold = true;
                var font = new MigraDoc.DocumentObjectModel.Font("Verdana", fontSize);

                var frame = sec.Headers.Primary.AddTextFrame();
                frame.Width = page.Width.Point - sec.PageSetup.RightMargin.Point - sec.PageSetup.LeftMargin.Point;
                frame.Top = ".25in";
                frame.Left = 0;
                frame.RelativeVertical = MigraDoc.DocumentObjectModel.Shapes.RelativeVertical.Page;

                Paragraph paragraph = frame.AddParagraph();
                paragraph.Format.Font = titleFont;
                paragraph.Format.Alignment = ParagraphAlignment.Center;
                paragraph.AddText(parms.ReportName);
                paragraph = frame.AddParagraph();
                paragraph.Format.Font = font;
                paragraph.Format.Alignment = ParagraphAlignment.Center;
                paragraph.AddText(parms.ReportDescription);
                
                frame = sec.Headers.Primary.AddTextFrame();
                frame.Height = ".2in";
                frame.Width = "1.5in";
                frame.Top = ".30in";
                frame.Left = (page.Width.Point - sec.PageSetup.LeftMargin.Point - sec.PageSetup.RightMargin.Point - frame.Width.Point);
                frame.RelativeVertical = MigraDoc.DocumentObjectModel.Shapes.RelativeVertical.Page;
                paragraph = frame.AddParagraph();
                paragraph.Format.Font = font.Clone();
                paragraph.Format.Alignment = ParagraphAlignment.Right;
                paragraph.AddText("Page ");
                paragraph.AddPageField();
                paragraph.AddText(" of ");
                paragraph.AddNumPagesField();

                Table table = sec.AddTable();
                table.Style = "Table";
                table.Borders.Color = MigraDoc.DocumentObjectModel.Colors.DarkGray;
                table.Borders.Width = 0.25;
                table.Borders.Left.Width = 0.25;
                table.Borders.Right.Width = 0.25;
                table.Rows.LeftIndent = 0;
                table.Rows.Alignment = RowAlignment.Center;
                table.Format.Font = new MigraDoc.DocumentObjectModel.Font("Verdana", fontSize);
                for (int x = 0; x < parms.ColumnNames.Length; x++)
                {
                    PdfTableColumnAdd(table, columnWidth[x], parms.ColumnNames[x]);
                }

                Row row = table.AddRow();
                row.HeadingFormat = true;
                row.Format.Font.Bold = true;
                row.Shading.Color = MigraDoc.DocumentObjectModel.Colors.LightGray;

                for (int x = 0; x < parms.ColumnNames.Length; x++)
                {
                    switch (parms.ColumnNames[x])
                    {
                        default:
                            row.Cells[x].AddParagraph(parms.ColumnHeadings[x]);
                            break;
                    }
                }

                using (var reader = cmd.ExecuteReader())
                {
                    int rowCnt = 0;
                    while (reader.Read())
                    {
                        try
                        {
                            rowCnt++;
                            row = table.AddRow();
                            for (int i = 0; i < parms.ColumnNames.Length; i++)
                            {
                                switch (reader[i].GetType().Name)
                                {
                                    case "Boolean":
                                        row.Cells[i].AddParagraph(BoolToString((bool)reader[i]));
                                        break;

                                    case "DateTime":
                                        row.Cells[i].AddParagraph(Zpm.FormatDate(reader[i]));
                                        break;

                                    default:
                                        row.Cells[i].AddParagraph(reader[i].ToString());
                                        break;
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            throw;
                        }
                    }
                }

                PdfDocumentRenderer renderer = new PdfDocumentRenderer(true);
                renderer.Document = doc;
                renderer.RenderDocument();

                string reportHandle = Guid.NewGuid().ToString();
                using (MemoryStream ms = new MemoryStream())
                {
                    renderer.PdfDocument.Save(ms);
                    TempData[reportHandle] = ms.ToArray();
                }
                return Json(reportHandle);
            }
        }

        protected virtual void PdfTableColumnAdd(Table table, double width, string columnName)
        {
            PdfTableColumnAdd(table, width, ParagraphAlignment.Left); // left align by default
        }


        protected virtual void PdfTableColumnAdd(Table table, double width, ParagraphAlignment align)
        {
            Column col = table.AddColumn(width + 4);
            col.Format.Alignment = align;
        }


        private double[] CalculateColumnWidths(ReportParameters parms, IDbCommand cmd, PdfPage page, double fontSize)
        {
            double[] columnWidth = new double[parms.ColumnNames.Length];
            XGraphics gfx = XGraphics.FromPdfPage(page);
            gfx.MUH = PdfFontEncoding.Unicode;
            var xFont = new XFont("Verdana", fontSize, XFontStyle.Bold);


            for (int i = 0; i < parms.ColumnHeadings.Length; i++)
                columnWidth[i] = gfx.MeasureString(parms.ColumnHeadings[i], xFont).Width;

            xFont = new XFont("Verdana", fontSize, XFontStyle.Regular);
            using (var reader = cmd.ExecuteReader())
            {
                int rowCnt = 0;
                double width;
                while (reader.Read() && rowCnt < 2000)
                {
                    try
                    {
                        rowCnt++;
                        for (int i = 0; i < parms.ColumnNames.Length; i++)
                        {
                            if (reader[i].GetType() == typeof(DateTime))
                                width = 50;
                            else
                                width = gfx.MeasureString(reader[i].ToString(), xFont).Width;
                            if (width > columnWidth[i])
                            {
                                columnWidth[i] = width;
                                switch (parms.ColumnNames[i])
                                {
                                    case "FullName":
                                    case "FirstLastName":
                                    case "LastFirstName":
                                    case "LastFirstMiddleName":
                                        if (columnWidth[i] > 72 * 2)
                                            columnWidth[i] = 72 * 2; // max 2 inches
                                        break;
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        gfx.Dispose();
                        throw;
                    }
                }
            }
            gfx.Dispose();
            for (var i = 0; i < columnWidth.Length; i++)
                columnWidth[i] += 4; // allow for padding.
            return columnWidth;
        }


        [HttpGet]
        public virtual ActionResult PdfDownload(string reportHandle)
        {
            return File((byte[])TempData[reportHandle], "application/pdf");
        }

        public string ColumnNameList(string[] columnNames)
        {
            StringBuilder list = new StringBuilder();

            foreach(string c in columnNames)
            {
                if (list.Length > 0)
                    list.Append(",");
                list.Append(DbColumnNameEscape(c));
            }
            return list.ToString();
        }
    }
}