using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace ZPM.NetDb.Models
{
    public class AspNetUser
    {
        [Key]
        public int Id { get; set; }

        [MaxLength(256)]
        public string Email { get; set; }

        public bool EmailConfirmed { get; set; }
        public string PasswordHash { get; set; }
        public string SecurityStamp { get; set; }
        public string PhoneNumber { get; set; }
        public bool PhoneNumberConfirmed { get; set; }
        public bool TwoFactorEnabled { get; set; }
        public DateTime? LockoutEndDateUtc { get; set; }
        public bool LockoutEnabled { get; set; }
        public int AccessFailedCount { get; set; }

        [MaxLength(256), Required]
        public string UserName { get; set; }  // note: UserName is the same as Email, login user name is the email address as currently configured.

        [MaxLength(50)]
        public string DisplayName { get; set; }

        [MaxLength(4)]
        public string UserInitials { get; set; }
    }
}
