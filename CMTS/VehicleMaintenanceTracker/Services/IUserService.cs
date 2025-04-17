using VehicleMaintenanceTracker.DTos;

namespace VehicleMaintenanceTracker.Services
{
    public interface IUserService
    {
        Task<AuthResponse> Register(RegisterRequest model);
        Task<AuthResponse> Login(LoginRequest model);
        Task<UserResponse> GetUserById(int userId);
        Task<IEnumerable<UserResponse>> GetAllUsers();
        Task<UserResponse> UpdateProfile(int userId, UpdateProfileRequest model);
        Task<bool> ChangePassword(int userId, ChangePasswordRequest model);
        Task<bool> ChangeUserRole(int userId, string newRole);
    }
}
