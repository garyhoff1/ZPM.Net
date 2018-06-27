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

    public class CustomerReportsController : ZpmReportBuilderController
    {
        public CustomerReportsController()
            : base("CustomerReports", 5000)
        {
        }

        public ActionResult CustomerReports()
        {
            return View();
        }

        protected override IDbCommand ReportCommand(ReportParameters parms /*, VoterDb.Entities db*/)
        {
            IDbCommand cmd = NewDbCommand("");
            var sql = "SELECT " + ColumnNameList(parms.ColumnNames) + " FROM (";
            sql = sql.Replace(DbColumnNameEscape("blank"), "'' as "+ DbColumnNameEscape("blank"));

            sql += "SELECT c.*, cc.Description as CustomerCategory from Customers as c" +
                   " LEFT JOIN CustomerCategories as cc on cc.CustomerCategoryId=c.CustomerCategoryId" +
                   " {WHERE}";

            //if (parms.Filters == null || parms.Filters.Length == 0)
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
                case "State":
                case "CreatedDttm":
                case "ChangedDttm":
                    PdfTableColumnAdd(table, columnWidth, ParagraphAlignment.Center);
                    break;
                default:
                    PdfTableColumnAdd(table, columnWidth, ParagraphAlignment.Left);
                    break;
            }
        }

    }
}