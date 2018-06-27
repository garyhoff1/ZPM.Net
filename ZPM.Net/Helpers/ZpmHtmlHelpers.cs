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
using System.Globalization;
using System.Linq;
using System.Linq.Expressions;
using System.Web;
using System.Web.Mvc;
using System.Web.Mvc.Html;

namespace Helpers
{
    public static class ZpmHtmlHelpers
    {
        private static Dictionary<string, string> stateList = new Dictionary<string, string>()
        {
            {"", "<select state>" },
            {"AL", "Alabama" },
            {"AK", "Alaska" },
            {"AZ", "Arizona" },
            {"AR", "Arkansas" },
            {"CA", "California" },
            {"CO", "Colorado" },
            {"CT", "Connecticut" },
            {"DE", "Delaware" },
            {"DC", "District of Columbia" },
            {"FL", "Florida" },
            {"GA", "Georgia" },
            {"HI", "Hawaii" },
            {"ID", "Idaho" },
            {"IL", "Illinois" },
            {"IN", "Indiana" },
            {"IA", "Iowa" },
            {"KS", "Kansas" },
            {"KY", "Kentucky" },
            {"LA", "Louisiana" },
            {"ME", "Maine" },
            {"MD", "Maryland" },
            {"MA", "Massachusetts" },
            {"MI", "Michigan" },
            {"MN", "Minnesota" },
            {"MS", "Mississippi" },
            {"MO", "Missouri" },
            {"MT", "Montana" },
            {"NE", "Nebraska" },
            {"NV", "Nevada" },
            {"NH", "New Hampshire" },
            {"NJ", "New Jersey" },
            {"NM", "New Mexico" },
            {"NY", "New York" },
            {"NC", "North Carolina" },
            {"ND", "North Dakota" },
            {"OH", "Ohio" },
            {"OK", "Oklahoma" },
            {"OR", "Oregon" },
            {"PA", "Pennsylvania" },
            {"RI", "Rhode Island" },
            {"SC", "South Carolina" },
            {"SD", "South Dakota" },
            {"TN", "Tennessee" },
            {"TX", "Texas" },
            {"UT", "Utah" },
            {"VT", "Vermont" },
            {"VA", "Virginia" },
            {"WA", "Washington" },
            {"WV", "West Virginia" },
            {"WI", "Wisconsin" },
            {"WY", "Wyoming" }
        };

        public static MvcHtmlString ZpmSelectState
               (this HtmlHelper html, string name, object attributes, string blankOption = "<select state>", string defaultValue = "")
        {
            stateList[""] = blankOption;
            //var exclude = new List<SelectListItem>
            //    { new SelectListItem { Selected = false, Text = "Arizona", Value = "AZ", Disabled = true } };

            if (attributes != null)
                return html.DropDownList(name, new SelectList(stateList, "key", "value", defaultValue), attributes);
            return html.DropDownList(name, new SelectList(stateList, "key", "value", defaultValue));
         }
    }
}