using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace ZPM.NetDb.Models
{
    public class AspNetUserLogin
    {
        [MaxLength(128)]
        [Key]
        [Column(Order = 1)]
        [Required]
        public string LoginProvider { get; set; }

        [MaxLength(128)]
        [Key]
        [Column(Order = 2)]
        [Required]
        public string ProviderKey { get; set; }

        [Key]
        [Column(Order = 3)]
        public int UserId { get; set; }

        
        [ForeignKey("UserId")]
        public AspNetUser AspNetUser { get; set; }
    }
}
