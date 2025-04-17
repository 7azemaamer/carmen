namespace VehicleMaintenanceTracker.Modules
{
    public class MaintenanceService
    {
        public int ServiceId { get; set; }
        public string ServiceName { get; set; }
        public decimal ServiceCost { get; set; }
        public int MinimumOdometer { get; set; }
        public int MaximumOdometer { get; set; }

        public ICollection<MaintenanceRequestService> MaintenanceRequestServices { get; set; }
    }
}