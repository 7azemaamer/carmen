namespace VehicleMaintenanceTracker.Modules
{
    public class MaintenanceRequestService
    {
        public int RequestServiceId { get; set; }
        public int RequestId { get; set; }  
        public int ServiceId { get; set; }  

        public MaintenanceRequest MaintenanceRequest { get; set; }
        public MaintenanceService MaintenanceService { get; set; }
    }
}