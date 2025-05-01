using System.ComponentModel.DataAnnotations;

namespace VehicleMaintenanceTracker.Modules
{
    public class User
    {
        public int UserId { get; set; }

        [Required]
        [StringLength(50)]
        public string Username { get; set; }


        [Required]
        public string PasswordHash { get; set; }
        

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; }


        [StringLength(20)]
        public string PhoneNumber { get; set; }


        [StringLength(200)]
        public required string Address { get; set; }


        [Required]
        [StringLength(10)]
        public string Role { get; set; } = "User";


        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? LastLogin { get; set; }
        public List<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
    }
}
