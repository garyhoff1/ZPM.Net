using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace ZPM.NetDb.Models
{
    public class Customer
    {
        public int CustomerId { get; set; }
        [MaxLength(50)]
        public string CustomerName { get; set; }
        [MaxLength(50)]
        public string Address { get; set; }
        [MaxLength(30)]
        public string City { get; set; }
        [MaxLength(2)]
        public string State { get; set; }
        [MaxLength(12)]
        public string ZipCode { get; set; }
        [MaxLength(20)]
        public string PhoneNumber { get; set; }
        [MaxLength(50)]
        public string Email { get; set; }
        public int? CustomerCategoryId { get; set; }
        public decimal CreditLimit { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime? ReviewDate { get; set; }

        public int CreatedById { get; set; }
        public int ChangedById { get; set; }
        public DateTime CreatedDttm { get; set; }
        public DateTime ChangedDttm { get; set; }
    }
}
