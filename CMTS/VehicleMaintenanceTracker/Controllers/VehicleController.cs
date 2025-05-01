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
    [Route("api/vehicles")]
    [ApiController]
    [Authorize] 
    public class VehicleController : ControllerBase
    {
        private readonly VMSDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;


        public VehicleController(VMSDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor; 

        }

        [HttpPost]
        public async Task<IActionResult> AddVehicle([FromBody] VehicleDto vehicleDto)
        {
            if (vehicleDto == null)
            {
                return BadRequest(new { message = "Invalid vehicle data." });
            }

            int userId = (int)GetUserIdFromToken();
            if (userId == 0)
            {
                return Unauthorized(new { message = "User not authorized." });
            }

            var vehicle = new Vehicle
            {
                UserId = userId,
                VehicleType = vehicleDto.VehicleType,
                LicensePlateNumber = vehicleDto.LicensePlateNumber,
                RegistrationDate = vehicleDto.RegistrationDate,
                ManufactureYear = vehicleDto.ManufactureYear,
                Status = "Active" 
            };

            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Vehicle added successfully",
                vehicle = new
                {
                    id = vehicle.VehicleId,
                    type = vehicle.VehicleType,
                    licensePlate = vehicle.LicensePlateNumber
                }
            });
        }


        [HttpGet]
        public async Task<IActionResult> GetUserVehicles()
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized(new { message = "Invalid token" });

            var vehicles = await _context.Vehicles
                .Where(v => v.UserId == userId.Value)
                .Select(v => new
                {
                    _id = v.VehicleId,
                    type = v.VehicleType,
                    licensePlate = v.LicensePlateNumber,
                    registrationDate = v.RegistrationDate,
                    year = v.ManufactureYear,
                    status = v.Status
                })
                .ToListAsync();

            return Ok(vehicles);
        }

        private int? GetUserIdFromToken()
        {
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
            {
                return null; 
            }

            if (int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }

            return null; 
        }

        [HttpGet("admin")]
        [Authorize(Roles = "Admin")] 
        public async Task<IActionResult> GetAllVehiclesForAdmin()
        {
            var vehicles = await _context.Vehicles
                .Include(v => v.User) 
                .Select(v => new
                {
                    _id = v.VehicleId,
                    type = v.VehicleType,
                    licensePlate = v.LicensePlateNumber,
                    registrationDate = v.RegistrationDate,
                    year = v.ManufactureYear,
                    status = v.Status,
                    owner = v.User.Username 
                })
                .ToListAsync();

            return Ok(vehicles);
        }

        [HttpPut("admin/update-status/{vehicleId}")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateVehicleStatus(int vehicleId, [FromBody] UpdateVehicleStatusDto statusDto)
        {
            if (statusDto == null || string.IsNullOrEmpty(statusDto.Status))
            {
                return BadRequest(new { message = "Invalid status data." });
            }

            var vehicle = await _context.Vehicles.FindAsync(vehicleId);
            if (vehicle == null)
            {
                return NotFound(new { message = "Vehicle not found." });
            }

            vehicle.Status = statusDto.Status;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Vehicle status updated successfully",
                vehicle = new
                {
                    id = vehicle.VehicleId,
                    type = vehicle.VehicleType,
                    licensePlate = vehicle.LicensePlateNumber,
                    newStatus = vehicle.Status
                }
            });
        }

        [HttpPut("{vehicleId}")]
        public async Task<IActionResult> UpdateVehicle(int vehicleId, [FromBody] UpdateVehicleDto vehicleDto)
        {
            if (vehicleDto == null)
            {
                return BadRequest(new { message = "Invalid vehicle data." });
            }

            var userId = GetUserIdFromToken();
            if (userId == null)
            {
                return Unauthorized(new { message = "Unauthorized user." });
            }

            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == vehicleId && v.UserId == userId.Value);
            if (vehicle == null)
            {
                return NotFound(new { message = "Vehicle not found or you don't have access to it." });
            }

            vehicle.VehicleType = vehicleDto.VehicleType;
            vehicle.LicensePlateNumber = vehicleDto.LicensePlateNumber;
            vehicle.RegistrationDate = vehicleDto.RegistrationDate;
            vehicle.ManufactureYear = vehicleDto.ManufactureYear;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Vehicle updated successfully",
                vehicle = new
                {
                    id = vehicle.VehicleId,
                    type = vehicle.VehicleType,
                    licensePlate = vehicle.LicensePlateNumber,
                    registrationDate = vehicle.RegistrationDate,
                    year = vehicle.ManufactureYear
                }
            });
        }

        [HttpDelete("{vehicleId}")]
        public async Task<IActionResult> DeleteVehicle(int vehicleId)
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
            {
                return Unauthorized(new { message = "Unauthorized user." });
            }

            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == vehicleId && v.UserId == userId.Value);
            if (vehicle == null)
            {
                return NotFound(new { message = "Vehicle not found or you don't have access to it." });
            }

            // Check if there are any maintenance requests for this vehicle
            var hasMaintenanceRequests = await _context.MaintenanceRequests.AnyAsync(m => m.VehicleId == vehicleId);
            
            // Check if there are any odometer readings for this vehicle
            var hasOdometerReadings = await _context.OdometerReadings.AnyAsync(o => o.VehicleId == vehicleId);

            if (hasMaintenanceRequests || hasOdometerReadings)
            {
                // Instead of deleting, mark as inactive
                vehicle.Status = "Inactive";
                await _context.SaveChangesAsync();
                
                return Ok(new
                {
                    message = "Vehicle has associated records and was marked as inactive instead of being deleted.",
                    vehicleId = vehicle.VehicleId
                });
            }
            else
            {
                // No associated records, safe to delete
                _context.Vehicles.Remove(vehicle);
                await _context.SaveChangesAsync();
                
                return Ok(new
                {
                    message = "Vehicle deleted successfully.",
                    vehicleId = vehicleId
                });
            }
        }
    }
}




