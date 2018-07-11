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
using System.Text;

namespace ZPM.Net.Controllers
{
    [Authorize]
    public class CustomerController : ZpmDataViewController
    {
        private ZpmDemoContext db = new ZpmDemoContext();
        public const int MaxListCount = 5000;

        protected override void Dispose(bool disposing)
        {
            if (disposing)
                db.Dispose();
            base.Dispose(disposing);
        }

        public ActionResult CustomerView()
        {
            ViewBag.ContactOptions = HtmlContactOptions();
            return View(db.Customers.OrderBy(r => r.CustomerName).ToList());
        }

        [HttpPost]
        public ActionResult ContactOptions()
        {
            return Json(HtmlContactOptions());
        }

        private string HtmlContactOptions()
        {
            var contacts = db.Contacts.Select(r => new IntValueOption()
            {
                value = r.ContactId,
                text = r.LastName + (r.FirstName != "" ? ", " + r.FirstName : "") + (r.MiddleName != "" ? " " + r.MiddleName : "")
            }).OrderBy(r => r.text).ToList();
            return HtmlOptions(contacts);
        }

        [HttpPost]
        public ActionResult GetModel(int id)
        {
            var model = db.Customers.Where(r => r.CustomerId == (int)id).SingleOrDefault();
            var ccList = db.CustomerContacts.Where(r => r.CustomerId == id).Select(r => r.ContactId).ToList();

            Dictionary<string, object> data = ConvertToDictionary(model);
            data["ContactIds"] = ccList;
            return Json(data);
        }

        [HttpPost]
        public ActionResult ReloadCustomerContacts(int customerId)
        {
            var data = new Dictionary<string, object>();
            data["Options"] = HtmlContactOptions();
            data["Values"] = db.CustomerContacts.Where(r => r.CustomerId == customerId).Select(r => r.ContactId).ToList();
            return Json(data);
        }

        [HttpPost]
        public JsonResult AddModel()
        {
            var cust = new Customer();
            cust.State = "MN";
            return Json(cust);
        }

        [HttpPost]
        public JsonResult SaveModel(CustomerForm form)
        {
            DateTime updateTime = DateTime.Now;
            SaveReturn saveReturn = new SaveReturn();

            if (form == null)
            {
                saveReturn.Messages.Add(new SaveMessage(SaveMessageType.Error,
                                                        SaveMessageDelivery.MessageLine,
                                                        "Data error, value is null"));
            }

            if (!saveReturn.HasErrors)
            {
                Customer cust;

                if (form.CustomerId == 0)
                { // new customer
                    cust = new Customer();
                    BindFormToDbModel(form, cust, saveReturn, updateTime);
                    if (!saveReturn.HasErrors)
                    {
                        cust.CreatedById = cust.ChangedById;
                        cust.CreatedDttm = cust.ChangedDttm;
                        db.Customers.Add(cust);
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
                                                                        "Duplicate Customer Name"));
                            }
                            else
                                throw Zpm.GetInnerException(ex);
                        }
                    }
                }
                else
                { // existing
                    cust = db.Customers.Where(r => r.CustomerId == form.CustomerId).SingleOrDefault();
                    BindFormToDbModel(form, cust, saveReturn, updateTime);
                    if (!saveReturn.HasErrors)
                        db.SaveChanges();
                }

                if (!saveReturn.HasErrors)
                {
                    var ccList = db.CustomerContacts.Where(r => r.CustomerId == cust.CustomerId).ToList();

                    if (form.ContactIds != null)
                    {
                        foreach (var id in form.ContactIds)
                        {
                            var cc = ccList.Find(r => r.ContactId == id);
                            if (cc == null)
                            {  // add
                                cc = new CustomerContact()
                                { CustomerId = cust.CustomerId, ContactId = id, CreatedById = User.Identity.GetUserId<int>(), CreatedDttm = updateTime };
                                db.CustomerContacts.Add(cc);
                            }
                            else
                            {
                                ccList.Remove(cc);
                            }
                        }
                    }
                    db.CustomerContacts.RemoveRange(ccList);
                    db.SaveChanges();
                }

                if (!saveReturn.HasErrors)
                {
                    var ccList = db.CustomerContacts.Where(r => r.CustomerId == cust.CustomerId).Select(r => r.ContactId).ToList();
                    Dictionary<string, object> data = ConvertToDictionary(cust);
                    data["ContactIds"] = ccList;
                    saveReturn.Model = data; // model to re-display
                }
            }
            return Json(saveReturn);
        }

        public class CustomerForm
        {
            public int CustomerId { get; set; }

            [DisplayFormat(ConvertEmptyStringToNull = false)]
            public string CustomerName { get; set; }

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

            public int? CustomerCategoryId { get; set; }
            public decimal CreditLimit { get; set; }
            public DateTime? ReviewDate { get; set; }
            public bool Statement { get; set; }
            public int[] ContactIds { get; set; }
        }

        private void BindFormToDbModel(CustomerForm form, Customer model, SaveReturn saveReturn, DateTime updateTime)
        {
            model.CustomerName = VerifyNotBlank(saveReturn, form.CustomerName, "CustomerName", "Customer Name");
            model.Address = form.Address;
            model.City = form.City;
            model.State = form.State;
            model.ZipCode = form.ZipCode;
            model.PhoneNumber = form.PhoneNumber;
            model.Email = form.Email;
            model.CustomerCategoryId = Zpm.NullIfZero(form.CustomerCategoryId);
            model.CreditLimit = form.CreditLimit;
            model.ReviewDate = form.ReviewDate;
            model.Statement = form.Statement;
            model.ChangedById = User.Identity.GetUserId<int>();
            model.ChangedDttm = updateTime;
        }

        public ActionResult DeleteModel(int id)
        {
            var cust = db.Customers.Where(r => r.CustomerId == id).SingleOrDefault();
            if (cust == null)
                return Json("CustomerId " + id.ToString() + " not found");

            db.Database.ExecuteSqlCommand("DELETE FROM CustomerContacts where CustomerId=@p0", id);

            db.Customers.Remove(cust);
            db.SaveChanges();
            return Json("");
        }

    }
}