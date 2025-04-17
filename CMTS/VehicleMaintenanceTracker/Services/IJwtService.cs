using System.Security.Claims;

namespace VehicleMaintenanceTracker.Services
{
    public interface IJwtService
    {
        string GenerateToken(int userId, string username, string email, string role);
        bool ValidateToken(string token, out List<Claim> claims);
    }
}
