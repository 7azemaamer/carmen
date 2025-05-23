﻿using System.ComponentModel.DataAnnotations;

namespace VehicleMaintenanceTracker.DTos
{
    public class ChangePasswordRequest
    {
        [Required]
        public string CurrentPassword { get; set; }

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; }

        [Required]
        [Compare("NewPassword")]
        public string ConfirmPassword { get; set; }
    }

    public class UpdateProfileRequest
    {
        [StringLength(50)]
        public required string Username { get; set; }

        [StringLength(20)]
        public required string PhoneNumber { get; set; }

        [StringLength(200)]
        public required string Address { get; set; }
    }

}
