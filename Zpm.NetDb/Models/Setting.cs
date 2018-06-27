using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace ZPM.NetDb.Models
{
    public class Setting
    {
        public int SettingId { get; set; }
        [MaxLength(30)]
        public string Category { get; set; }
        [MaxLength(50)]
        public string Key { get; set; }
        [MaxLength(8000)]
        public string Value { get; set; }
        public int CreatedByUserId { get; set; }
        public int ChangedByUserId { get; set; }
        public System.DateTime CreatedDttm { get; set; }
        public System.DateTime ChangedDttm { get; set; }
        public Nullable<System.DateTime> tmStamp { get; set; }
    }
}
