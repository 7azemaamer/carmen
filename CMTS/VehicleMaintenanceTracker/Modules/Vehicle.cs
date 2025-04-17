namespace VehicleMaintenanceTracker.Modules
{
    public class Vehicle
    {
        public int VehicleId { get; set; }
        public int UserId { get; set; }
        public string VehicleType { get; set; }
        public string LicensePlateNumber { get; set; }
        public DateTime RegistrationDate { get; set; }

        public int ManufactureYear { get; set; }
        public string Status { get; set; } 

        public User User { get; set; }
        public ICollection<OdometerReading> OdometerReadings { get; set; } = new List<OdometerReading>();
        public ICollection<MaintenanceRequest> MaintenanceRequests { get; set; } = new List<MaintenanceRequest>();
    }

  

}

