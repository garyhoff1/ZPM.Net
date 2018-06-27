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
    /* 
     * This is a template.  copy code to a new controler class and search on %% for code that needs to be changed
     * for these changes, be sure to saerch with match case and whole word!!
     * %% change all db.Settings to db.[tableName]s
     * %% change all Setting to tableName (model name)
     * %% change all SettingId to Id or whatever is the primary id for the table
     * %% change all SettingForm to [tableName]Form
    */

    [Authorize]
    public class TemplateController : ZpmDataViewController //%% change TemplateController to [tableName]Controller
    {
        private ZpmDemoContext db = new ZpmDemoContext();
        public const int MaxListCount = 5000;

        protected override void Dispose(bool disposing)
        {
            if (disposing)
                db.Dispose();
            base.Dispose(disposing);
        }

        public ActionResult TemplateView()  //%% change TemplateView to [tableName]View
        {
            return View(db.Settings.OrderBy(r => r.Key).ToList()); //%% r.Key tp whatever order you want the records to be dispolayed.
        }

        [HttpPost]
        public ActionResult GetModel(int id)
        {
            var model = db.Settings.Where(r => r.SettingId == (int)id).SingleOrDefault();
            return Json(model);
        }

        [HttpPost]
        public JsonResult AddModel()
        {
            var model = new Setting();
            return Json(model);
        }

        [HttpPost]
        public JsonResult SaveModel(SettingForm form)
        {
            SaveReturn saveReturn = new SaveReturn();
            if (form == null)
            { // sanity check, shouldn't happen
                saveReturn.Messages.Add(new SaveMessage(SaveMessageType.Error,
                                                        SaveMessageDelivery.MessageLine,
                                                        "Data error, value is null"));
            }

            if (!saveReturn.HasErrors)
            {
                Setting model;

                if (form.SettingId == 0)
                { // new category
                    model = new Setting();
                    BindFormToDbModel(form, model, saveReturn);
                    if (!saveReturn.HasErrors)
                    {
                        model.CreatedByUserId = model.ChangedByUserId;
                        model.CreatedDttm = model.ChangedDttm;
                        db.Settings.Add(model);
                        try
                        {
                            db.SaveChanges();
                        }
                        catch (Exception ex)
                        {
                            if (IsDuplicateKey(ex)) //%% this is only needed if there's a unique key on the table.
                            {
                                //%% display a message that tells the user what the duplicate field is
                                saveReturn.Messages.Add(new SaveMessage(SaveMessageType.Error,
                                                                        SaveMessageDelivery.MessageLine,
                                                                        "Duplicate setting value"));
                            }
                            else
                                throw;
                        }
                    }
                }
                else
                { // existing
                    model = db.Settings.Where(r => r.SettingId == form.SettingId).SingleOrDefault();
                    BindFormToDbModel(form, model, saveReturn);
                    if (!saveReturn.HasErrors)
                        db.SaveChanges();
                }
                if (!saveReturn.HasErrors)
                    saveReturn.Model = model; // model to re-display
            }
            return Json(saveReturn);
        }

        public class SettingForm
        {
            public int SettingId { get; set; }
            public string Value { get; set; } // %% replace this line with a line for each data value returned from the webpage
        }

        private void BindFormToDbModel(SettingForm form, Setting model, SaveReturn saveReturn)
        {
            // %% there needs to be a line of code like the one below for each field in SettingForm to assign the form fields to the model fields.
            model.Value = VerifyNotBlank(saveReturn, form.Value, "Value", "Setting Value"); 
                    // %% if value is blank, an error message is stored in saveReturn, "Value" is the control ID (usually the field name) on the webpage to focus on
                    // "Setting Value" is the text prompt to the user.  User will see "Setting Value cannot be blank"
        }

        public ActionResult DeleteModel(int id)
        {
            var model = db.Settings.Where(r => r.SettingId == id).SingleOrDefault();
            if (model == null)
                return Json("SettingId " + id.ToString() + " not found");
            db.Settings.Remove(model);
            db.SaveChanges();
            return Json("");
        }

    }
}