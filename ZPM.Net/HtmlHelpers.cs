using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Mvc.Html;

namespace ZPM.Net
{
    public static class HtmlHelpers
    {
        public static MvcHtmlString CustomerCategorySelect(this HtmlHelper html, string name, object attributes, string defaultValue = "", string blankOption = "<select category>")
        {
            using (var db = ZPM.Net.Controllers.ZpmController.NewDbContext())
            {
                var list = db.CustomerCategorys.Select(r => new SelectListItem() { Value = r.CustomerCategoryId.ToString(), Text = r.Description }).OrderBy(r => r.Text).ToList();
                if (!string.IsNullOrEmpty(blankOption))
                    list.Insert(0, new SelectListItem() { Value = "", Text = blankOption });
                if (attributes != null)
                    return html.DropDownList(name, new SelectList(list, "Value", "Text", defaultValue), attributes);
                return html.DropDownList(name, new SelectList(list, "Value", "Text", defaultValue));
            }
        }
    }
}