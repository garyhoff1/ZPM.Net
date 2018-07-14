/*
Copyright(c) 2018 Zpm Software Inc, ZpmSoftware.com

The Code Project Open License (CPOL) governs Your use of ZPM.Net.
This License is intended to allow developers to use the Source Code
and Executable Files provided as part of the Work in any application in any form.

The full agremeent is available at: https://www.codeproject.com/info/cpol10.aspx
*/

using System;
using System.Collections.Generic;
using System.Text;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ZPM.Net
{
    public static class Zpm
    {
        public static string BlankIfNull(string value)
        {
            return (value == null ? "" : value);
        }

        public static int? NullIfZero(int? value)
        {
            return (value == 0 ? (int?)null : value);
        }

        public static string HtmlOptions(List<SelectListItem> items)
        {
            StringBuilder options = new StringBuilder();
            foreach (var i in items)
            {
                if (i.Selected)
                    options.Append("<option value=\"" + i.Value + "\" selected=\"selected\">" + i.Text + "</option>");
                else
                    options.Append("<option value=\"" + i.Value + "\">" + HttpContext.Current.Server.HtmlEncode(i.Text) + "</option>");
            }
            return options.ToString();
        }

        public static Exception GetInnerException(Exception e)
        {
            while (e.InnerException != null)
                e = e.InnerException;
            return e;
        }

        public static string FormatDate(object dt)
        {
            if (dt is DBNull || dt == null)
                return "";
            if (dt is string)
                return DateTime.Parse((string)dt).ToString("MM/dd/yyyy");
            return ((DateTime)dt).ToString("MM/dd/yyyy");
        }
    }
}