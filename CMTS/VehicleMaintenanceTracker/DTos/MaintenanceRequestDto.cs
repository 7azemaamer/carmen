namespace VehicleMaintenanceTracker.DTos
{
    public class MaintenanceRequestDto
    {
        public int VehicleId { get; set; }
        public int Reading { get; set; }
        public List<string> Services { get; set; } = new List<string>();
        public string AdminNotes { get; set; } = "";

    }
}
