using Microsoft.EntityFrameworkCore;
using VehicleMaintenanceTracker.Context;
using VehicleMaintenanceTracker.DTos;
using VehicleMaintenanceTracker.Modules;

namespace VehicleMaintenanceTracker.Services
{
    public class UserService : IUserService
    {
        private readonly VMSDbContext _context;
        private readonly IJwtService _jwtService;

        public UserService(VMSDbContext context, IJwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        public async Task<AuthResponse> Register(RegisterRequest model)
        {
            if (await _context.Users.AnyAsync(u => u.Email == model.Email))
            {
                throw new Exception("User with this email already exists");
            }

            var user = new User
            {
                Username = model.Username,
                Email = model.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password),
                PhoneNumber = model.PhoneNumber,
                Address = model.Address,
                Role = "User",
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = _jwtService.GenerateToken(user.UserId, user.Username, user.Email, user.Role);

            return new AuthResponse
            {
                UserId = user.UserId,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                Token = token
            };
        }

        public async Task<AuthResponse> Login(LoginRequest model)
        {
            var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == model.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(model.Password, user.PasswordHash))
            {
                throw new Exception("Invalid email or password");
            }

            user.LastLogin = DateTime.Now;
            await _context.SaveChangesAsync();

            // Generate token
            var token = _jwtService.GenerateToken(user.UserId, user.Username, user.Email, user.Role);

            return new AuthResponse
            {
                UserId = user.UserId,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                Token = token
            };
        }

        public async Task<UserResponse> GetUserById(int userId)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                throw new Exception("User not found");
            }

            return MapToUserResponse(user);
        }

        public async Task<IEnumerable<UserResponse>> GetAllUsers()
        {
            var users = await _context.Users.ToListAsync();
            return users.Select(MapToUserResponse);
        }

        public async Task<UserResponse> UpdateProfile(int userId, UpdateProfileRequest model)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                throw new Exception("User not found");
            }

            if (!string.IsNullOrEmpty(model.Username))
                user.Username = model.Username;

            if (!string.IsNullOrEmpty(model.PhoneNumber))
                user.PhoneNumber = model.PhoneNumber;

            if (!string.IsNullOrEmpty(model.Address))
                user.Address = model.Address;

            await _context.SaveChangesAsync();

            return MapToUserResponse(user);
        }

        public async Task<bool> ChangePassword(int userId, ChangePasswordRequest model)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                throw new Exception("User not found");
            }

            if (!BCrypt.Net.BCrypt.Verify(model.CurrentPassword, user.PasswordHash))
            {
                throw new Exception("Current password is incorrect");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.NewPassword);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ChangeUserRole(int userId, string newRole)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                throw new Exception("User not found");
            }

            if (newRole != "Admin" && newRole != "User")
            {
                throw new Exception("Invalid role. Role must be 'Admin' or 'User'");
            }

            user.Role = newRole;
            await _context.SaveChangesAsync();

            return true;
        }

        private UserResponse MapToUserResponse(User user)
        {
            return new UserResponse
            {
                UserId = user.UserId,
                Username = user.Username,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Address = user.Address,
                Role = user.Role,
                CreatedAt = user.CreatedAt,
                LastLogin = user.LastLogin
            };
        }
    }
}

