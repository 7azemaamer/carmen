namespace VehicleMaintenanceTracker.Modules
{
    public class MaintenanceRequest
    {
        public int RequestId { get; set; }
        public int VehicleId { get; set; } 
        public int OdometerReadingId { get; set; }  
        public DateTime RequestDate { get; set; }
        public required string Status { get; set; }  // Pending, Completed, Canceled
        public DateTime? CompletionDate { get; set; }
        public string? AdminNotes { get; set; }

        public Vehicle Vehicle { get; set; }
        public OdometerReading OdometerReading { get; set; }
        public ICollection<MaintenanceRequestService> MaintenanceRequestServices { get; set; }
    }

}
