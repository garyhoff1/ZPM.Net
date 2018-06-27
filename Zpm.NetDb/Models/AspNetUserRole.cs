using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace ZPM.NetDb.Models
{
    public class AspNetUserRole
    {
        [Key]
        [Column(Order = 1)]
        public int UserId { get; set; }

        [Key]
        [Column(Order = 2)]
        public int RoleId { get; set; }

        [ForeignKey("UserId")]
        public AspNetUser AspNetUser { get; set; }
        [ForeignKey("RoleId")]
        public AspNetRole AspNetRole { get; set; }
    }
}
