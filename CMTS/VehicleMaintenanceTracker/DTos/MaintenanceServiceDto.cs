namespace VehicleMaintenanceTracker.DTos
{
    public class MaintenanceServiceDto
    {
        public string ServiceName { get; set; }
        public decimal ServiceCost { get; set; }
        public int MinimumOdometer { get; set; }
        public int MaximumOdometer { get; set; }
    }
}
