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