using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
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

            // Check if a service with the same name already exists
            var existingService = await _context.MaintenanceServices
                .FirstOrDefaultAsync(s => s.ServiceName.ToLower() == serviceDto.ServiceName.ToLower());
            
            if (existingService != null)
            {
                return BadRequest(new { 
                    message = "A service with this name already exists.", 
                    serviceName = serviceDto.ServiceName 
                });
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

            // Check if a service with the same name already exists (excluding the current service)
            var existingService = await _context.MaintenanceServices
                .FirstOrDefaultAsync(s => 
                    s.ServiceId != id && 
                    s.ServiceName.ToLower() == serviceDto.ServiceName.ToLower());
            
            if (existingService != null)
            {
                return BadRequest(new { 
                    message = "Another service with this name already exists.", 
                    serviceName = serviceDto.ServiceName 
                });
            }

            service.ServiceName = serviceDto.ServiceName;
            service.ServiceCost = serviceDto.ServiceCost;
            service.MinimumOdometer = serviceDto.MinimumOdometer;
            service.MaximumOdometer = serviceDto.MaximumOdometer;

            await _context.SaveChangesAsync();
            return Ok(new { 
                message = "Service updated successfully.",
                serviceId = id
            });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteService(int id)
        {
            try
            {
                var service = await _context.MaintenanceServices.FindAsync(id);
                if (service == null)
                    return NotFound(new { message = "Service not found." });

                // Check for references in a way that won't throw exceptions
                bool hasReferences = await _context.MaintenanceRequestServices
                    .AnyAsync(mrs => mrs.ServiceId == id);

                if (hasReferences)
                {
                    // Return a more detailed error message
                    return BadRequest(new { 
                        message = "Cannot delete this service because it is associated with maintenance requests.",
                        detail = "You must delete the associated maintenance requests first or remove this service from them.",
                        hasReferences = true
                    });
                }

                // Safer approach to delete the service
                _context.MaintenanceServices.Remove(service);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Service deleted successfully." });
            }
            catch (DbUpdateException dbEx)
            {
                // Handle database constraint violation specifically
                return StatusCode(500, new { 
                    message = "Database constraint violation when deleting the service.",
                    detail = "This service is referenced by existing maintenance requests and cannot be deleted.",
                    error = dbEx.InnerException?.Message ?? dbEx.Message,
                    hasReferences = true
                });
            }
            catch (Exception ex)
            {
                // Handle any other exceptions
                return StatusCode(500, new { 
                    message = "An error occurred while deleting the service.",
                    detail = ex.InnerException?.Message ?? ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

      


    }
}

