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


            return View(db.Customers.OrderBy(r => r.CustomerName).ToList());
        }

        [HttpPost]
        public ActionResult GetModel(int id)
        {
            var cust = db.Customers.Where(r => r.CustomerId == (int)id).SingleOrDefault();
            return Json(cust);
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
                    BindFormToDbModel(form, cust, saveReturn);
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
                    BindFormToDbModel(form, cust, saveReturn);
                    if (!saveReturn.HasErrors)
                        db.SaveChanges();
                }
                if (!saveReturn.HasErrors)
                    saveReturn.Model = cust; // model to re-display
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
        }

        private void BindFormToDbModel(CustomerForm form, Customer model, SaveReturn saveReturn)
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
            model.ChangedById = User.Identity.GetUserId<int>();
            model.ChangedDttm = DateTime.Now;
        }

        public ActionResult DeleteModel(int id)
        {
            var cust = db.Customers.Where(r => r.CustomerId == id).SingleOrDefault();
            if (cust == null)
                return Json("CustomerId " + id.ToString() + " not found");
            db.Customers.Remove(cust);
            db.SaveChanges();
            return Json("");
        }

    }
}