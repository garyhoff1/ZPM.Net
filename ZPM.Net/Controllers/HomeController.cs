using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using ZPM.NetDb;
using ZPM.NetDb.Models;

namespace ZPM.Net.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        // HttpContext.Current.User.Identity.GetUserId(); from anywhere

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
    }
}