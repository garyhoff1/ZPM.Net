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
using System.Reflection;
using System.Data;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using System.Text;

namespace ZPM.Net.Controllers
{
    [Authorize]
    public class ZpmController : Controller
    {
        public ZpmController() : base()
        {
            
        }

        public static void LogMessage(string message)
        {
            string fileName = System.Web.HttpContext.Current.Server.MapPath("~/App_Data/WebLog.txt");
            using (System.IO.StreamWriter sw = new System.IO.StreamWriter(fileName, true))
            {
                sw.WriteLine(DateTime.Now.ToString("yyyy-MM-dd HH:mm") + "  " + message);
                sw.Close();
            }
        }

        public static Models.ApplicationUser CurrentUser()
        {
            return System.Web.HttpContext.Current.GetOwinContext().GetUserManager<ApplicationUserManager>().FindById(System.Web.HttpContext.Current.User.Identity.GetUserId<int>());
        }

        [HttpPost]
        public JsonResult KeepSessionAlive(string dateTime)
        {
            return new JsonResult { Data = "Success" };
        }

        public static bool IsDuplicateKey(Exception ex)
        {
            ex = GetInnerException(ex);
            return (ex.Message.Contains("Duplicate entry") || ex.Message.Contains("Cannot insert duplicate key"));  // MySql or MS Sql
        }

        public static Exception GetInnerException(Exception e)
        {
            while (e.InnerException != null)
                e = e.InnerException;
            return e;
        }

        public static ZPM.NetDb.ZpmDemoContext NewDbContext()
        {
            return new NetDb.ZpmDemoContext();
        }

        public static IDbCommand NewDbCommand(string cmdText)
        {
            return new SqlCommand(cmdText);
        }

        public const string DbColumnNameEscapeLeft = "[";
        public const string DbColumnNameEscapeRight = "]";

        public static string DbColumnNameEscape(string columnName)
        {
            return DbColumnNameEscapeLeft + columnName + DbColumnNameEscapeRight;
        }

        /// <summary>
        /// This converts a class to a Dictionary list.  Is NOT recursive
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        public static Dictionary<string, object> ConvertToDictionary(object data)
        {
            if (data == null)
                return null;
            Dictionary<string, object> d = data.GetType().GetProperties(BindingFlags.Instance | BindingFlags.Public).ToDictionary(prop => prop.Name, prop => prop.GetValue(data, null)); // convert to dictionary
            return d;
        }

        public class StringValueOption
        {
            public string value { get; set; }
            public string text { get; set; }
        }

        public static string HtmlOptions(List<StringValueOption> data)
        {
            StringBuilder options = new StringBuilder();
            foreach (var d in data)
                options.Append("<option value=\"" + d.value + "\">" + HttpUtility.HtmlEncode(d.text) + "</option>");
            return options.ToString();
        }

        public class IntValueOption
        {
            public int value { get; set; }
            public string text { get; set; }
        }

        public static string HtmlOptions(List<IntValueOption> data)
        {
            StringBuilder options = new StringBuilder();
            foreach (var d in data)
                options.Append("<option value=\"" + d.value.ToString() + "\">" + HttpUtility.HtmlEncode(d.text) + "</option>");
            return options.ToString();
        }
    }
}