using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNet.Identity;
using ZPM.NetDb;
using ZPM.NetDb.Models;
using System.Text;

namespace ZPM.Net.Controllers
{
    [Authorize]
    public class ContactController : ZpmDataViewController
    {
        private ZpmDemoContext db = new ZpmDemoContext();
        public const int MaxListCount = 5000;

        protected override void Dispose(bool disposing)
        {
            if (disposing)
                db.Dispose();
            base.Dispose(disposing);
        }

        public ActionResult ContactView()
        {
            var customers = db.Customers.Select(r => new IntValueOption() { value = r.CustomerId, text = r.CustomerName }).OrderBy(r=> r.text).ToList();
            ViewBag.CustomerOptions = HtmlOptions(customers);
            return View(db.Contacts.OrderBy(r => r.LastName).ThenBy(r=> r.FirstName).ThenBy(r=>r.MiddleName).ToList());
        }

        [HttpPost]
        public ActionResult GetModel(int id)
        {
            var model = db.Contacts.Where(r => r.ContactId == (int)id).SingleOrDefault();
            var ccList = db.CustomerContacts.Where(r => r.ContactId == id).Select(r=> r.CustomerId).ToList();

            Dictionary<string, object> data = ConvertToDictionary(model);
            data["CustomerIds"] = ccList;
            return Json(data);
        }

        [HttpPost]
        public JsonResult AddModel()
        {
            var model = new Contact();
            return Json(model);
        }

        [HttpPost]
        public JsonResult SaveModel(ContactForm form)
        {
            DateTime updateTime = DateTime.Now;

            SaveReturn saveReturn = new SaveReturn();
            if (form == null)
            { // sanity check, shouldn't happen
                saveReturn.Messages.Add(new SaveMessage(SaveMessageType.Error,
                                                        SaveMessageDelivery.MessageLine,
                                                        "Data error, value is null"));
            }

            if (!saveReturn.HasErrors)
            {
                Contact model;

                if (form.ContactId == 0)
                { // new category
                    model = new Contact();
                    BindFormToDbModel(form, model, saveReturn, updateTime);
                    if (!saveReturn.HasErrors)
                    {
                        model.CreatedById = model.ChangedById;
                        model.CreatedDttm = model.ChangedDttm;
                        db.Contacts.Add(model);
                        try
                        {
                            db.SaveChanges();
                        }
                        catch (Exception ex)
                        {
                            if (IsDuplicateKey(ex))
                            {
                                // display a message that tells the user what the duplicate field is
                                saveReturn.Messages.Add(new SaveMessage(SaveMessageType.Error,
                                                                        SaveMessageDelivery.MessageLine,
                                                                        "Duplicate contact name"));
                            }
                            else
                                throw;
                        }
                    }
                }
                else
                { // existing
                    model = db.Contacts.Where(r => r.ContactId == form.ContactId).SingleOrDefault();
                    BindFormToDbModel(form, model, saveReturn, updateTime);
                    if (!saveReturn.HasErrors)
                        db.SaveChanges();
                }

                if (!saveReturn.HasErrors)
                 {
                    var ccList = db.CustomerContacts.Where(r => r.ContactId == model.ContactId).ToList();

                    if (form.CustomerIds != null)
                    {
                        foreach (var id in form.CustomerIds)
                        {
                            if (id != 0) // 0 is handled by web client
                            {
                                var cc = ccList.Find(r => r.CustomerId == id);
                                if (cc == null)
                                {  // add
                                    cc = new CustomerContact()
                                    { CustomerId = id, ContactId = model.ContactId, CreatedById = User.Identity.GetUserId<int>(), CreatedDttm = updateTime };
                                    db.CustomerContacts.Add(cc);
                                }
                                else
                                {
                                    ccList.Remove(cc);
                                }
                            }
                        }
                    }
                    db.CustomerContacts.RemoveRange(ccList);
                    db.SaveChanges();
                }

                if (!saveReturn.HasErrors)
                {
                    var ccList = db.CustomerContacts.Where(r => r.ContactId == model.ContactId).Select(r => r.CustomerId).ToList();
                    Dictionary<string, object> data = ConvertToDictionary(model);
                    data["CustomerIds"] = ccList;
                    saveReturn.Model = data; // model to re-display
                }
            }
            return Json(saveReturn);
        }

        public class ContactForm
        {
            public int ContactId { get; set; }
            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string LastName { get; set; }
            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string FirstName { get; set; }
            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string MiddleName { get; set; }
            public bool UseCustomerAddress { get; set; }
            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string Address { get; set; }
            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string City { get; set; }
            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string State { get; set; }
            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string ZipCode { get; set; }
            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string PhoneNumber { get; set; }
            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string Email { get; set; }
            public int CreatedById { get; set; }
            public int ChangedById { get; set; }
            public DateTime CreatedDttm { get; set; }
            public DateTime ChangedDttm { get; set; }

            public int[] CustomerIds { get; set; }
        }

        private void BindFormToDbModel(ContactForm form, Contact model, SaveReturn saveReturn, DateTime updateTime)
        {
            model.LastName = VerifyNotBlank(saveReturn, form.LastName, "LastName", "Last Name");
            model.FirstName = form.FirstName;
            model.MiddleName = form.MiddleName;
            model.UseCustomerAddress = form.UseCustomerAddress;
            model.Address = form.Address;
            model.City = form.City;
            model.State = form.State;
            model.ZipCode = form.ZipCode;
            model.PhoneNumber = form.PhoneNumber;
            model.Email = form.Email;
            model.ChangedById = User.Identity.GetUserId<int>();
            model.ChangedDttm = updateTime;
    }

    public ActionResult DeleteModel(int id)
        {
            var model = db.Contacts.Where(r => r.ContactId == id).SingleOrDefault();
            if (model == null)
                return Json("ContactId " + id.ToString() + " not found");

            db.Database.ExecuteSqlCommand("DELETE FROM CustomerContacts where ContactId=@p0", id);

            db.Contacts.Remove(model);
            db.SaveChanges();
            return Json("");
        }

    }
}
