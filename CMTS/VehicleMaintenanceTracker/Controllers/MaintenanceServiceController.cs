using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleMaintenanceTracker.Context;
using VehicleMaintenanceTracker.DTos;
using VehicleMaintenanceTracker.Modules;

namespace VehicleMaintenanceTracker.Controllers
{
    [Route("api/maintenance-services")]
    [ApiController]
    [Authorize]
    public class MaintenanceServiceController : ControllerBase
    {
        private readonly VMSDbContext _context;

        public MaintenanceServiceController(VMSDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddService([FromBody] MaintenanceServiceDto serviceDto)
        {
            if (serviceDto == null)
            {
                return BadRequest(new { message = "Invalid service data." });
            }

            var service = new MaintenanceService
            {
                ServiceName = serviceDto.ServiceName,
                ServiceCost = serviceDto.ServiceCost,
                MinimumOdometer = serviceDto.MinimumOdometer,
                MaximumOdometer = serviceDto.MaximumOdometer
            };

            _context.MaintenanceServices.Add(service);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Service added successfully",
                service = new
                {
                    id = service.ServiceId,
                    name = service.ServiceName,
                    cost = service.ServiceCost
                }
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetAllServices()
        {
            var services = await _context.MaintenanceServices
                .Select(s => new
                {
                    id = s.ServiceId,
                    name = s.ServiceName,
                    cost = s.ServiceCost,
                    minOdometer = s.MinimumOdometer,
                    maxOdometer = s.MaximumOdometer
                })
                .ToListAsync();

            return Ok(services);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetServiceById(int id)
        {
            var service = await _context.MaintenanceServices
                .Where(s => s.ServiceId == id)
                .Select(s => new
                {
                    id = s.ServiceId,
                    name = s.ServiceName,
                    cost = s.ServiceCost,
                    minOdometer = s.MinimumOdometer,
                    maxOdometer = s.MaximumOdometer
                })
                .FirstOrDefaultAsync();

            if (service == null)
                return NotFound(new { message = "Service not found." });

            return Ok(service);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateService(int id, [FromBody] MaintenanceServiceDto serviceDto)
        {
            var service = await _context.MaintenanceServices.FindAsync(id);
            if (service == null)
                return NotFound(new { message = "Service not found." });

            service.ServiceName = serviceDto.ServiceName;
            service.ServiceCost = serviceDto.ServiceCost;
            service.MinimumOdometer = serviceDto.MinimumOdometer;
            service.MaximumOdometer = serviceDto.MaximumOdometer;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Service updated successfully." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteService(int id)
        {
            var service = await _context.MaintenanceServices.FindAsync(id);
            if (service == null)
                return NotFound(new { message = "Service not found." });

            _context.MaintenanceServices.Remove(service);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Service deleted successfully." });
        }

      


    }
}

