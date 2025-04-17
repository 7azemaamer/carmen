namespace VehicleMaintenanceTracker.DTos
{
    public class OdometerReadingDto
    {
        public int VehicleId { get; set; }
        public int Reading { get; set; }  
        public DateTime ReadingDate { get; set; } = DateTime.UtcNow;
    }
}
