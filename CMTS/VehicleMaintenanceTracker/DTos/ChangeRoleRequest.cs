using System.ComponentModel.DataAnnotations;

namespace VehicleMaintenanceTracker.DTos
{
    public class ChangeRoleRequest
    {
        [Required]
        [StringLength(10)]
        public string NewRole { get; set; } // "Admin" or "User"
    }
}
