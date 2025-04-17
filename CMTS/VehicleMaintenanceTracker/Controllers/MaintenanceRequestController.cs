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
    [Route("api/maintenance")]
    [ApiController]
    [Authorize]
    public class MaintenanceRequestController : ControllerBase
    {
        private readonly VMSDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public MaintenanceRequestController(VMSDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }


        [HttpPost]
        public async Task<IActionResult> BookService([FromBody] BookServiceDto requestDto)
        {
            if (requestDto == null || requestDto.ServiceId <= 0 || requestDto.VehicleId <= 0 || requestDto.Reading <= 0)
            {
                return BadRequest(new { message = "Invalid request data." });
            }

            int? userId = GetUserIdFromToken();
            if (userId == null)
            {
                return Unauthorized(new { message = "User not authorized." });
            }

            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.VehicleId == requestDto.VehicleId && v.UserId == userId);

            if (vehicle == null)
            {
                return NotFound(new { message = "Vehicle not found or not authorized." });
            }

            var service = await _context.MaintenanceServices
                .FirstOrDefaultAsync(s => s.ServiceId == requestDto.ServiceId);

            if (service == null)
            {
                return NotFound(new { message = "Service not found." });
            }

            if (!(service.MinimumOdometer <= requestDto.Reading && service.MaximumOdometer >= requestDto.Reading))
            {
                return BadRequest(new { message = "This service is not available for the given odometer reading." });
            }

            var odometerReading = new OdometerReading
            {
                VehicleId = requestDto.VehicleId,
                Reading = requestDto.Reading,
                ReadingDate = DateTime.UtcNow
            };
            _context.OdometerReadings.Add(odometerReading);
            await _context.SaveChangesAsync();

            var maintenanceRequest = new MaintenanceRequest
            {
                VehicleId = requestDto.VehicleId,
                OdometerReadingId = odometerReading.ReadingId,
                RequestDate = DateTime.UtcNow,
                Status = "Pending"
            };
            _context.MaintenanceRequests.Add(maintenanceRequest);
            await _context.SaveChangesAsync();

            var maintenanceRequestService = new MaintenanceRequestService
            {
                RequestId = maintenanceRequest.RequestId,
                ServiceId = requestDto.ServiceId
            };
            _context.MaintenanceRequestServices.Add(maintenanceRequestService);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Service booked successfully.",
                requestId = maintenanceRequest.RequestId,
                serviceId = requestDto.ServiceId,
                status = "Pending"
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetUserMaintenanceRequests()
        {
            int? userId = GetUserIdFromToken();
            if (userId == null)
            {
                return Unauthorized(new { message = "User not authorized." });
            }

            var requests = await _context.MaintenanceRequests
                .Include(m => m.Vehicle)
                .Include(m => m.MaintenanceRequestServices)
                    .ThenInclude(mrs => mrs.MaintenanceService)
                .Where(m => m.Vehicle.UserId == userId)
                .Select(m => new
                {
                    requestId = m.RequestId,
                    vehicleId = m.VehicleId,
                    requestDate = m.RequestDate,
                    status = m.Status,
                    completionDate = m.CompletionDate.HasValue
                        ? m.CompletionDate.Value.ToString("yyyy-MM-dd HH:mm:ss")  
                        : "The completion date will be updated as soon as details are available.",
                    adminNotes = !string.IsNullOrEmpty(m.AdminNotes)
                        ? m.AdminNotes
                        : "Admin notes will be updated as soon as details are available.",
                    services = m.MaintenanceRequestServices
                        .Select(s => s.MaintenanceService.ServiceName)
                        .ToList()
                })
                .ToListAsync();

            return Ok(requests);
        }

        [HttpGet("all-requests")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllMaintenanceRequests()
        {
            var requests = await _context.MaintenanceRequests
                .Include(r => r.Vehicle)
                .Include(r => r.OdometerReading)
                .Include(r => r.MaintenanceRequestServices)
                    .ThenInclude(mrs => mrs.MaintenanceService)
                .OrderByDescending(r => r.RequestDate)
                .Select(r => new
                {
                    requestId = r.RequestId,
                    vehicleType = r.Vehicle.VehicleType,
                    licensePlateNumber = r.Vehicle.LicensePlateNumber,
                    odometerReading = r.OdometerReading.Reading,
                    requestDate = r.RequestDate.ToString("yyyy-MM-dd HH:mm:ss"),
                    status = r.Status,
                    completionDate = r.CompletionDate.HasValue ? r.CompletionDate.Value.ToString("yyyy-MM-dd HH:mm:ss") : null,
                    adminNotes = r.AdminNotes,
                    services = r.MaintenanceRequestServices.Select(mrs => new
                    {
                        serviceId = mrs.ServiceId,
                        serviceName = mrs.MaintenanceService.ServiceName,
                        serviceCost = mrs.MaintenanceService.ServiceCost
                    }).ToList()
                })
                .ToListAsync();

            return Ok(requests);
        }



        [HttpPut("admin/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateMaintenanceStatus(int id, [FromBody] UpdateMaintenanceStatusDto statusDto)
        {
            var request = await _context.MaintenanceRequests.FindAsync(id);
            if (request == null)
            {
                return NotFound(new { message = "Maintenance request not found." });
            }

            request.Status = statusDto.Status;
            if (statusDto.Status == "Completed")
            {
                request.CompletionDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Maintenance request updated." });
        }
        [HttpPut("admin/note/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateAdminNote(int id, [FromBody] UpdateAdminNoteDto noteDto)
        {
            var request = await _context.MaintenanceRequests.FindAsync(id);
            if (request == null)
            {
                return NotFound(new { message = "Maintenance request not found." });
            }

            request.AdminNotes = noteDto.AdminNotes;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Admin note updated successfully." });
        }
        [HttpPut("admin/completion/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCompletionDate(int id, [FromBody] UpdateCompletionDateDto completionDto)
        {
            var request = await _context.MaintenanceRequests.FindAsync(id);
            if (request == null)
            {
                return NotFound(new { message = "Maintenance request not found." });
            }

            request.CompletionDate = completionDto.CompletionDate;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Completion date updated successfully." });
        }



        private int? GetUserIdFromToken()
        {
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
                return null;

            return int.TryParse(userIdClaim.Value, out int userId) ? userId : null;
        }

        public class BookServiceDto
        {
            public int VehicleId { get; set; }
            public int ServiceId { get; set; }
            public int Reading { get; set; }
        }
        public class UpdateAdminNoteDto
        {
            public required string AdminNotes { get; set; }
        }

        public class UpdateCompletionDateDto
        {
            public DateTime CompletionDate { get; set; }
        }


    }
}

