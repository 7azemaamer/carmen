namespace VehicleMaintenanceTracker.DTos
{
    public class VehicleDto
    {
        public string VehicleType { get; set; }
        public string LicensePlateNumber { get; set; }
        public DateTime RegistrationDate { get; set; }
        public int ManufactureYear { get; set; }
    }
}
