using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace ZPM.NetDb.Models
{
    public class CustomerContact
    {
        public int CustomerContactId { get; set; }
        public int CustomerId { get; set; }
        public int ContactId { get; set; }

        public int CreatedById { get; set; }
        public DateTime CreatedDttm { get; set; }

        [ForeignKey("CustomerId")]
        public Customer Customer { get; set; }
        [ForeignKey("ContactId")]
        public Contact Contact { get; set; }
    }
}
