using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace ZPM.NetDb.Models
{
    public class CustomerCategory
    {
        public int CustomerCategoryId { get; set; }
        [MaxLength(50)]
        public string Description { get; set; }

        public ICollection<Customer> Customers { get; set; }
    }
}
