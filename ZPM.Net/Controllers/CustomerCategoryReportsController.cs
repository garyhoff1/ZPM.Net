using System;
using System.Collections.Generic;
using System.Linq;
using System.Drawing;
using System.Web;
using System.Web.Mvc;
using Microsoft.AspNet.Identity;
using System.Text;
using System.Data;
using System.Web.Script.Serialization;
using System.ComponentModel.DataAnnotations;
using System.IO;
using PdfSharp.Pdf;
using PdfSharp.Drawing;
using MigraDoc.DocumentObjectModel;
using MigraDoc.DocumentObjectModel.Tables;
using System.Data.SqlClient;
using ZPM.NetDb;

namespace ZPM.Net.Controllers
{

    public class CustomerCategoryReportsController : ZpmReportBuilderController
    {
        public CustomerCategoryReportsController()
            : base("CustomerCategoryReports", 5000) // 1st parm: name of category where report names are stored on settings table
        {
        }

        public ActionResult CustomerCategoryReports()
        {
            return View();
        }

        protected override IDbCommand ReportCommand(ReportParameters parms)
        {
            IDbCommand cmd = NewDbCommand("");
            var sql = "SELECT " + ColumnNameList(parms.ColumnNames) + " FROM ("; // filter out selected fields from all fields in the query
            sql = sql.Replace(DbColumnNameEscape("blank"), "'' as " + DbColumnNameEscape("blank"));

            sql += "SELECT * from CustomerCategories {WHERE}"; // returns all possible fields for the query

            //if (parms.Filters == null || parms.Filters.Length == 0) // use if a very large table
            //    throw new Exception("At least one filter must be selected.");

            sql += ") as tmp";
            sql = sql.Replace("{WHERE}", WhereSql(parms, cmd));
            sql += OrderBySql(parms);
            cmd.CommandText = sql;
            return cmd;
        }

        /// <summary>
        /// Customize column alignment
        /// </summary>
        /// <param name="table"></param>
        /// <param name="columnWidth"></param>
        /// <param name="columnName"></param>
        protected override void PdfTableColumnAdd(Table table, double columnWidth, string columnName)
        {
            switch (columnName)
            {
                case "column name": // change to actual column name
                    PdfTableColumnAdd(table, columnWidth, ParagraphAlignment.Center);
                    break;
                default:
                    PdfTableColumnAdd(table, columnWidth, ParagraphAlignment.Left);
                    break;
            }
        }
    }
}