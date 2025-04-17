using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VehicleMaintenanceTracker.Context;
using VehicleMaintenanceTracker.DTos;
using VehicleMaintenanceTracker.Modules;

namespace VehicleMaintenanceTracker.Controllers
{
    
    [ApiController]
    [Route("api/odometer")]
    [Authorize]
    public class OdometerReadingController : ControllerBase
    {
        private readonly VMSDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public OdometerReadingController(VMSDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        [HttpPost]
        public async Task<IActionResult> AddOdometerReading([FromBody] OdometerReadingDto readingDto)
        {
            if (readingDto == null)
            {
                return BadRequest(new { message = "Invalid data." });
            }

            int? userId = GetUserIdFromToken();
            if (userId == null)
            {
                return Unauthorized(new { message = "User not authorized." });
            }

            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.VehicleId == readingDto.VehicleId && v.UserId == userId);

            if (vehicle == null)
            {
                return NotFound(new { message = "Vehicle not found or not authorized." });
            }

            var reading = new OdometerReading
            {
                VehicleId = readingDto.VehicleId,
                Reading = readingDto.Reading,
                ReadingDate = DateTime.UtcNow
            };

            _context.OdometerReadings.Add(reading);
            await _context.SaveChangesAsync();

            var requiredServices = GetRequiredServices(reading.Reading);

            return Ok(new
            {
                message = "Odometer reading saved",
                requiredServices = requiredServices.Select(s => new { s.ServiceName, s.ServiceCost })
            });
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetUserOdometerReadings([FromQuery] int? vehicleId)
        {
            int? userId = GetUserIdFromToken();
            if (userId == null)
            {
                return Unauthorized(new { message = "User not authorized." });
            }

            var query = _context.OdometerReadings
                .Include(r => r.Vehicle) 
                .Where(r => _context.Vehicles.Any(v => v.VehicleId == r.VehicleId && v.UserId == userId));

            if (vehicleId.HasValue)
            {
                query = query.Where(r => r.VehicleId == vehicleId.Value);
            }

            var readings = await query
                .OrderByDescending(r => r.ReadingDate)
                .Select(r => new
                {
                    vehicleType = r.Vehicle.VehicleType, 
                    licensePlateNumber = r.Vehicle.LicensePlateNumber, 
                    reading = r.Reading,
                    readingDate = r.ReadingDate.ToString("yyyy-MM-dd HH:mm:ss")
                })
                .ToListAsync();

            return Ok(readings);
        }


        private List<MaintenanceService> GetRequiredServices(int currentReading)
        {
            return _context.MaintenanceServices
                .Where(s => s.MinimumOdometer <= currentReading && s.MaximumOdometer >= currentReading)
                .ToList();
        }



        private int? GetUserIdFromToken()
        {
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
                return null;

            return int.TryParse(userIdClaim.Value, out int userId) ? userId : null;
        }
    }
}

