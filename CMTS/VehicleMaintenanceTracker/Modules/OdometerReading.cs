namespace VehicleMaintenanceTracker.Modules
{
    public class OdometerReading
    {
        public int ReadingId { get; set; }
        public int VehicleId { get; set; }  
        public int Reading { get; set; }  // Value in km
        public DateTime ReadingDate { get; set; }

        public Vehicle Vehicle { get; set; }
        public MaintenanceRequest MaintenanceRequest { get; set; }
    }
}