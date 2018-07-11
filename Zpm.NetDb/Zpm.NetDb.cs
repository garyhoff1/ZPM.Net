using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.Entity;
using System.Threading.Tasks;

using ZPM.NetDb.Models;

namespace ZPM.NetDb
{
    public class ZpmDemoContext : DbContext
    {
        private static string connectionString = null;

        public static string ConnectionString
        {
            get
            {
                if (connectionString == null)
                {
                    ConnectionStringSettings mySetting = ConfigurationManager.ConnectionStrings["ZpmDemo"];
                    if (mySetting == null || string.IsNullOrEmpty(mySetting.ConnectionString))
                        throw new Exception("Fatal error: missing connecting string 'ZpmDemo' in web.config file");
                    connectionString = mySetting.ConnectionString;
                }
                return connectionString;
            }
        }

        public ZpmDemoContext() : base(ConnectionString)
        {
            Database.SetInitializer(new ZpmDemoInitializer());
        }
        /*
        protected override void OnModelCreating(DbModelBuilder mb)
        {
            base.OnModelCreating(mb);

            / *
            mb.Entity<Task>().HasRequired(t => t.Project).WithMany(
                  p => p.Tasks).HasForeignKey(t => t.ProjectId).WillCascadeOnDelete(false);
            mb.Entity<Task>().HasRequired(p => p.AssignedTo);
            mb.Entity<Person>().Property(d => d.BirthDate).HasColumnName("Birth");
            mb.Entity<Project>().Property(p => p.Name).HasMaxLength(255).IsRequired();
            mb.Entity<Project>().HasRequired(p => p.Manager);
            * /

        }
*/
        public DbSet<AspNetUser> AspNetUsers { get; set; }
        public DbSet<AspNetRole> AspNetRoles { get; set; }
        public DbSet<AspNetUserRole> AspNetUserRoles { get; set; }
        public DbSet<AspNetUserClaim> AspNetUserClaims { get; set; }
        public DbSet<AspNetUserLogin> AspNetUserLogins { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<CustomerCategory> CustomerCategorys { get; set; }
        public DbSet<Contact> Contacts { get; set; }
        public DbSet<CustomerContact> CustomerContacts { get; set; }
        public DbSet<Setting> Settings { get; set; }

    }

    // DropCreateDatabaseIfModelChanges
    // DropCreateDatabaseAlways

    public class ZpmDemoInitializer : DropCreateDatabaseIfModelChanges<ZpmDemoContext>
    {
        protected override void Seed(ZpmDemoContext context)
        {
            context.Database.ExecuteSqlCommand("CREATE UNIQUE INDEX RoleNameIndex ON AspNetRoles (Name ASC)");
            context.Database.ExecuteSqlCommand("CREATE UNIQUE INDEX UserNameIndex ON AspNetUsers (UserName ASC)");

            context.Database.ExecuteSqlCommand("CREATE UNIQUE INDEX IX_CustomerCategory_Description ON CustomerCategories (Description)");
            context.Database.ExecuteSqlCommand("CREATE UNIQUE INDEX IX_Customer_CustomerName ON Customers (CustomerName)");

            IList<CustomerCategory> ccList = new List<CustomerCategory>();
            ccList.Add(new CustomerCategory() { Description = "Retail" });
            ccList.Add(new CustomerCategory() { Description = "Wholesale" });
            context.CustomerCategorys.AddRange(ccList);

            context.Settings.Add(new Setting()
            {
                Category = "TEST",
                Key = "TEST",
                Value = "TEST",
                CreatedDttm = DateTime.Now,
                ChangedDttm = DateTime.Now,
                CreatedByUserId = 1,
                ChangedByUserId = 1
            });

            context.Customers.Add(new Customer()
            {
                CustomerName = "ABC Company",
                Address = "123 Main Street",
                City = "Chaska",
                State = "MN",
                ZipCode = "55318",
                CreatedById = 1,
                ChangedById = 1,
                CreatedDttm = DateTime.Now,
                ChangedDttm = DateTime.Now,
            });
            context.Customers.Add(new Customer()
            {
                CustomerName = "Waconia Theaters",
                Address = "100 1st Avenue",
                City = "Waconia",
                State = "MN",
                ZipCode = "55387",
                CreatedById = 1,
                ChangedById = 1,
                CreatedDttm = DateTime.Now,
                ChangedDttm = DateTime.Now,
            });
            context.SaveChanges();

            for(int x=1; x<=200; x++)
            {
                context.Customers.Add(new Customer()
                {
                    CustomerName = "ZZ Test " + x.ToString(),
                    Address = (100+x).ToString() + " 1st Avenue",
                    City = "Waconia",
                    State = "MN",
                    ZipCode = "55387",
                    PhoneNumber = "952-442-1" + (100 + x).ToString(),
                    CreatedById = 1,
                    ChangedById = 1,
                    CreatedDttm = DateTime.Now,
                    ChangedDttm = DateTime.Now,
                });
                context.SaveChanges();
            }

            base.Seed(context);
        }
    }
}
