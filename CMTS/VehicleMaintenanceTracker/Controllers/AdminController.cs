using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleMaintenanceTracker.Context;
using VehicleMaintenanceTracker.DTos;
using VehicleMaintenanceTracker.Modules;
using VehicleMaintenanceTracker.Services;

namespace VehicleMaintenanceTracker.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly VMSDbContext _context;

        public AdminController(IUserService userService, VMSDbContext context)
        {
            _userService = userService;
            _context = context;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                var users = await _userService.GetAllUsers();
                return Ok(users);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("users/{userId}")]
        public async Task<IActionResult> GetUserById(int userId)
        {
            try
            {
                var user = await _userService.GetUserById(userId);
                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("users/{userId}/role")]
        public async Task<IActionResult> ChangeUserRole(int userId, [FromBody] ChangeRoleRequest request)
        {
            try
            {
                await _userService.ChangeUserRole(userId, request.NewRole);
                return Ok(new { message = "User role updated successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("create-admin")]
        public async Task<IActionResult> CreateAdmin([FromBody] RegisterRequest model)
        {
            try
            {
                var user = new User
                {
                    Username = model.Username,
                    Email = model.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password),
                    PhoneNumber = model.PhoneNumber,
                    Address = model.Address,
                    Role = "Admin",
                    CreatedAt = DateTime.Now
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Admin user created successfully", userId = user.UserId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardSummary()
        {
            try
            {
                var totalUsers = await _context.Users.CountAsync();
                var totalVehicles = await _context.Vehicles.CountAsync();
                var totalPendingMaintenance = await _context.MaintenanceRequests
                    .CountAsync(m => m.Status == "Pending");

                return Ok(new
                {
                    totalUsers,
                    totalVehicles,
                    totalPendingMaintenance
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("maintenance-requests")]
        public async Task<IActionResult> GetAllMaintenanceRequests()
        {
            try
            {
                var requests = await _context.MaintenanceRequests
                    .Include(r => r.Vehicle)
                    .ThenInclude(v => v.User)
                    .Include(r => r.OdometerReading)
                    .Include(r => r.MaintenanceRequestServices)
                    .ThenInclude(mrs => mrs.MaintenanceService)
                    .ToListAsync();

                var result = requests.Select(r => new
                {
                    r.RequestId,
                    r.Status,
                    r.RequestDate,
                    r.CompletionDate,
                    r.AdminNotes,
                    Vehicle = new
                    {
                        r.Vehicle.VehicleId,
                        r.Vehicle.VehicleType,
                        r.Vehicle.LicensePlateNumber,
                        Owner = r.Vehicle.User.Username
                    },
                    OdometerReading = r.OdometerReading.Reading,
                    Services = r.MaintenanceRequestServices.Select(s => new
                    {
                        s.MaintenanceService.ServiceName,
                        s.MaintenanceService.ServiceCost
                    })
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("maintenance-requests/{requestId}")]
        public async Task<IActionResult> UpdateMaintenanceStatus(int requestId, [FromBody] UpdateMaintenanceRequest model)
        {
            try
            {
                var request = await _context.MaintenanceRequests.FindAsync(requestId);

                if (request == null)
                {
                    return NotFound(new { message = "Maintenance request not found" });
                }

                request.Status = model.Status;
                request.AdminNotes = model.AdminNotes;

                if (model.Status == "Completed")
                {
                    request.CompletionDate = DateTime.Now;

                    var vehicle = await _context.Vehicles.FindAsync(request.VehicleId);
                    if (vehicle != null)
                    {
                        vehicle.Status = "Normal";
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Maintenance request updated successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("services")]
        public async Task<IActionResult> GetAllServices()
        {
            var services = await _context.MaintenanceServices.ToListAsync();
            return Ok(services);
        }

        [HttpPost("services")]
        public async Task<IActionResult> AddService([FromBody] MaintenanceServiceRequest model)
        {
            try
            {
                var service = new MaintenanceService
                {
                    ServiceName = model.ServiceName,
                    ServiceCost = model.ServiceCost,
                    MinimumOdometer = model.MinimumOdometer,
                    MaximumOdometer = model.MaximumOdometer
                };

                _context.MaintenanceServices.Add(service);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Service added successfully", serviceId = service.ServiceId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("services/{serviceId}")]
        public async Task<IActionResult> UpdateService(int serviceId, [FromBody] MaintenanceServiceRequest model)
        {
            try
            {
                var service = await _context.MaintenanceServices.FindAsync(serviceId);

                if (service == null)
                {
                    return NotFound(new { message = "Service not found" });
                }

                service.ServiceName = model.ServiceName;
                service.ServiceCost = model.ServiceCost;
                service.MinimumOdometer = model.MinimumOdometer;
                service.MaximumOdometer = model.MaximumOdometer;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Service updated successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("services/{serviceId}")]
        public async Task<IActionResult> DeleteService(int serviceId)
        {
            try
            {
                var service = await _context.MaintenanceServices.FindAsync(serviceId);

                if (service == null)
                {
                    return NotFound(new { message = "Service not found" });
                }

                _context.MaintenanceServices.Remove(service);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Service deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public class UpdateMaintenanceRequest
    {
        public string Status { get; set; } // "Pending", "Completed", "Canceled"
        public string AdminNotes { get; set; }
    }

    public class MaintenanceServiceRequest
    {
        public string ServiceName { get; set; }
        public decimal ServiceCost { get; set; }
        public int MinimumOdometer { get; set; }
        public int MaximumOdometer { get; set; }
    }
}

