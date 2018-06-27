using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNet.Identity;
using ZPM.NetDb;
using ZPM.NetDb.Models;
using System.Threading.Tasks;

namespace ZPM.Net.Controllers
{
    [Authorize]
    public class CustomerCategoryController : ZpmDataViewController
    {
        private ZpmDemoContext db = new ZpmDemoContext();
        public const int MaxListCount = 5000;

        protected override void Dispose(bool disposing)
        {
            if (disposing)
                db.Dispose();
            base.Dispose(disposing);
        }

        public ActionResult CustomerCategoryView()
        {
            return View(db.CustomerCategorys.OrderBy(r => r.Description).ToList());
        }

        [HttpPost]
        public ActionResult GetModel(int id)
        {
            var cc = db.CustomerCategorys.Where(r => r.CustomerCategoryId == (int)id).SingleOrDefault();
            return Json(cc);
        }

        [HttpPost]
        public JsonResult AddModel()
        {
            var cc = new CustomerCategory();
            return Json(cc);
        }

        [HttpPost]
        public JsonResult SaveModel(CustomerCategoryForm form)
        {
            SaveReturn saveReturn = new SaveReturn();
            if (form == null)
            {
                saveReturn.Messages.Add(new SaveMessage(SaveMessageType.Error, 
                                                        SaveMessageDelivery.MessageLine, 
                                                        "Data error, value is null"));
            }

            if (!saveReturn.HasErrors)
            {
                CustomerCategory cc;

                if (form.CustomerCategoryId == 0)
                { // new category
                    cc = new CustomerCategory();
                    BindFormToDbModel(form, cc, saveReturn);
                    if (!saveReturn.HasErrors)
                    {
                        db.CustomerCategorys.Add(cc);
                        try
                        {
                            db.SaveChanges();
                        }
                        catch (Exception ex)
                        {
                            if (IsDuplicateKey(ex))
                            {
                                saveReturn.Messages.Add(new SaveMessage(SaveMessageType.Error,
                                                                        SaveMessageDelivery.MessageLine,
                                                                        "Duplicate Customer Category Description"));
                            }
                            else
                                throw;
                        }
                    }
                }
                else
                { // existing
                    cc = db.CustomerCategorys.Where(r => r.CustomerCategoryId == form.CustomerCategoryId).SingleOrDefault();
                    BindFormToDbModel(form, cc, saveReturn);
                    if (!saveReturn.HasErrors)
                        db.SaveChanges();
                }
                if (!saveReturn.HasErrors)
                    saveReturn.Model = cc; // model to re-display
            }
            return Json(saveReturn);
        }

        public class CustomerCategoryForm
        {
            public int CustomerCategoryId { get; set; }
            public string Description { get; set; }
        }

        private void BindFormToDbModel(CustomerCategoryForm form, CustomerCategory cc, SaveReturn saveReturn)
        {
            cc.Description = VerifyNotBlank(saveReturn, form.Description, "Description", "Category Description");
        }

        public ActionResult DeleteModel(int id)
        {
            var cc = db.CustomerCategorys.Where(r => r.CustomerCategoryId == id).SingleOrDefault();
            if (cc == null)
                return Json("CustomerCategoryId " + id.ToString() + " not found");
            db.CustomerCategorys.Remove(cc);
            db.SaveChanges();
            return Json("");
        }

    }
}