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
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ZPM.Net.Controllers
{
    [Authorize]
    public class ZpmDataViewController : ZpmController
    {
        // Parent Class for list view controlers

        public ZpmDataViewController()
        {
            ViewBag.Options = new DataViewOptions();
        }

        public string VerifyNotBlank(SaveReturn saveReturn, string value, string ctrlName, string displayName = null)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                saveReturn.Messages.Add(new SaveMessage(SaveMessageType.Error, SaveMessageDelivery.MessageLine,
                                        (displayName == null ? ctrlName : displayName) + " is a required field", ctrlName));
            }
            return value;
        }

        public int VerifyNotZero(SaveReturn saveReturn, int value, string ctrlName, string displayName = null)
        {
            if (value == 0)
            {
                saveReturn.Messages.Add(new SaveMessage(SaveMessageType.Error, SaveMessageDelivery.MessageLine,
                                        (displayName == null ? ctrlName : displayName) + " is a required field", ctrlName));
            }
            return value;
        }

        public enum SaveMessageType { Normal, Warning, Error }
        public enum SaveMessageDelivery { MessageLine, Popup }

        public class SaveMessage
        {
            public SaveMessageType Type;
            public SaveMessageDelivery Delivery;
            public string Message;
            public string FocusControl;  // focus on this field if specified.

            public SaveMessage(SaveMessageType type, SaveMessageDelivery delivery, string message, string focusControl = "")
            {
                Type = type;
                Delivery = delivery;
                Message = message;
                FocusControl = focusControl;
            }
        }

        public class SaveReturn
        {
            public object Model = null;
            public List<SaveMessage> Messages = new List<SaveMessage>();
            public bool HasErrors
            {
                get
                {
                    foreach (var m in Messages)
                    {
                        if (m.Type == SaveMessageType.Error)
                            return true;
                    }
                    return false;
                }
            }
        }

    }

    public class DataViewOptions
    {
        public string Title = ""; // for page tab title
        public string ModelName = ""; // for page display. must not have spaces.
        public string DataViewContainerId = ""; // 
        public string ModelTextName = ""; // text name of madel for display to user
        public int Height = 0; // pixel height of the list and panel sections
        public int ListWidth = 0;  // pixel width of the list section
        public int PanelWidth = 0;  // pixel width of the panel section
        public int FilterHeight = 0;  // pixel width of the filter section
        public string GetModel = "";  // method to get model data for existing record
        public string AddModel = ""; // method to get default model data for new record
        public string SaveModel = ""; // method to save model data
        public string DeleteModel = ""; // method to delete record
        public string FocusOnChange = ""; // focus on this control when changing an existing record
        public string FocusOnAdd = ""; // focus on this control when adding a new record

        public int ListTableHeight { get { return Height - FilterHeight - 22; } }
    }

    // Helpers ======================================================
    public static class DataViewHelpers
    {
        public static IHtmlString DataView_AddButton(this HtmlHelper helper, DataViewOptions options)
        {
            TagBuilder tb = new TagBuilder("img");
            tb.Attributes.Add("src", System.Web.VirtualPathUtility.ToAbsolute("~/content/images/AddIcon.png"));
            tb.Attributes.Add("alt", "Add " + options.ModelTextName);
            tb.Attributes.Add("title", "Add new " + options.ModelTextName);
            tb.Attributes.Add("class", "zpm-dv-add-button");
            tb.Attributes.Add("style", "z-index:90; margin-left:" + (options.ListWidth-21).ToString() + "px;");
            tb.Attributes.Add("onclick", "document.zpmDataView.Add('" + options.AddModel + "')");
            return new MvcHtmlString(tb.ToString());
        }

        public static MvcHtmlString DataView_ControlPanel(this HtmlHelper helper, DataViewOptions options)
        {
            return MvcHtmlString.Create(
                "<div class=\"zpm-dv-control-panel\">" +
                    helper.DataView_Message(options).ToString() +
                    helper.DataView_SaveButton(options).ToString() +
                    helper.DataView_DeleteButton(options).ToString() +
                    helper.DataView_CancelButton(options).ToString() +
                "</div>");

        }

        public static MvcHtmlString DataView_Message(this HtmlHelper helper, DataViewOptions options)
        {
            return MvcHtmlString.Create("<div id=\"message\" class=\"zpm-dv-control-panel-message\"></div>");
        }

        public static MvcHtmlString DataView_SaveButton(this HtmlHelper helper, DataViewOptions options)
        {
            return MvcHtmlString.Create("<input type=\"button\" class=\"zpm-dv-control-panel-save\" value=\"Save\" onclick=\"document.zpmDataView.Save('" + options.SaveModel + "')\" />");
        }

        public static MvcHtmlString DataView_DeleteButton(this HtmlHelper helper, DataViewOptions options)
        {
            return MvcHtmlString.Create("<input type=\"button\" class=\"zpm-dv-control-panel-delete\" value=\"Delete\" onclick=\"document.zpmDataView.Delete('" + options.DeleteModel + "')\" />");
        }

        public static MvcHtmlString DataView_CancelButton(this HtmlHelper helper, DataViewOptions options)
        {
            return MvcHtmlString.Create("<input type=\"button\" class=\"zpm-dv-control-panel-cancel\" value=\"Cancel\" onclick=\"document.zpmDataView.Cancel()\" />");
        }

        public static MvcHtmlString DataView_NewDataView(this HtmlHelper helper, DataViewOptions options)
        {
            return MvcHtmlString.Create(
                    "new ZpmDataView(" +
                        "\"" + options.ModelName + "View\"," +
                        "\"" + options.ModelTextName + "\"," +
                        "\"" + options.GetModel + "\"," +
                        "\"" + options.FocusOnChange + "\"," +
                        "\"" + options.FocusOnAdd + "\"" +
                    ")");
        }

        public static MvcHtmlString DataView_Filter(this HtmlHelper helper, DataViewOptions options, int height = 22, string prefixHtml = "")
        {
            options.FilterHeight = height;
            return MvcHtmlString.Create(
                "<div class=\"zpm-dv-filter-div\" style=\"height:" + (options.FilterHeight).ToString() + "px\">" +
                prefixHtml +
                "Filter" +
                "  <input class=\"zpm-dv-filter\" type=\"text\" maxlength=\"30\" onkeyup =\"document.zpmDataView.FilterKeyUp(this)\"" +
                        " style=\"width:" + (options.ListWidth-105).ToString() + "px\" />" +
                "  <input type=\"button\" value=\"Clear\" onclick=\"document.zpmDataView.FilterClear();\" />" +
                "</div>");
        }
    }

}
