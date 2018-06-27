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
    public class Customer2Controller : ZpmDataViewController 
    {
        private ZpmDemoContext db = new ZpmDemoContext();
        public const int MaxListCount = 5000;

        protected override void Dispose(bool disposing)
        {
            if (disposing)
                db.Dispose();
            base.Dispose(disposing);
        }

        public ActionResult Customer2View()
        {
            return View(db.Customers.OrderBy(r => r.CustomerName).ToList()); 
        }

        [HttpPost]
        public ActionResult GetModel(int id)
        {
            System.Threading.Thread.Sleep(5000);
            var model = db.Customers.Where(r => r.CustomerId == (int)id).SingleOrDefault();
            return Json(model);
        }

        [HttpPost]
        public JsonResult AddModel()
        {
            var model = new Customer();
            return Json(model);
        }

        [HttpPost]
        public JsonResult SaveModel(CustomerForm form)
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
                Customer model;

                if (form.CustomerId == 0)
                { // new category
                    model = new Customer();
                    BindFormToDbModel(form, model, saveReturn);
                    if (!saveReturn.HasErrors)
                    {
                        model.CreatedById = model.ChangedById;
                        model.CreatedDttm = model.ChangedDttm;
                        db.Customers.Add(model);
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
                                                                        "Duplicate customer name"));
                            }
                            else
                                throw;
                        }
                    }
                }
                else
                { // existing
                    model = db.Customers.Where(r => r.CustomerId == form.CustomerId).SingleOrDefault();
                    BindFormToDbModel(form, model, saveReturn);
                    if (!saveReturn.HasErrors)
                        db.SaveChanges();
                }
                if (!saveReturn.HasErrors)
                    saveReturn.Model = model; // model to re-display
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
            var model = db.Customers.Where(r => r.CustomerId == id).SingleOrDefault();
            if (model == null)
                return Json("CustomerId " + id.ToString() + " not found");
            db.Customers.Remove(model);
            db.SaveChanges();
            return Json("");
        }

    }
}