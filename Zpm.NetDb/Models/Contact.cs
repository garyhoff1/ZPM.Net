using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace ZPM.NetDb.Models
{
    public class Contact
    {
        public int ContactId { get; set; }
        [MaxLength(50)]
        public string LastName { get; set; }
        [MaxLength(30)]
        public string FirstName { get; set; }
        [MaxLength(30)]
        public string MiddleName { get; set; }

        public bool UseCustomerAddress { get; set; }
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

        public int CreatedById { get; set; }
        public int ChangedById { get; set; }
        public DateTime CreatedDttm { get; set; }
        public DateTime ChangedDttm { get; set; }
    }
}
