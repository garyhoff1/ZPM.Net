/*
Copyright(c) 2018 Zpm Software Inc, ZpmSoftware.com

The Code Project Open License (CPOL) governs Your use of ZPM.Net.
This License is intended to allow developers to use the Source Code
and Executable Files provided as part of the Work in any application in any form.

The full agremeent is available at: https://www.codeproject.com/info/cpol10.aspx
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