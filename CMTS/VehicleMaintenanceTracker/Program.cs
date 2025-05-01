using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using VehicleMaintenanceTracker.Context;
using VehicleMaintenanceTracker.Modules;
using VehicleMaintenanceTracker.Services;

namespace VehicleMaintenanceTracker
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);


            builder.Services.AddControllers();
            // https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddHttpContextAccessor();

            // Configure database based on configuration settings
            if (builder.Configuration.GetValue<bool>("UseInMemoryDatabase"))
            {
                builder.Services.AddDbContext<VMSDbContext>(options =>
                    options.UseInMemoryDatabase("VehicleMaintenanceDb"));
                
                Console.WriteLine("Using in-memory database");
            }
            else if (builder.Configuration.GetValue<bool>("UseSQLiteDatabase"))
            {
                builder.Services.AddDbContext<VMSDbContext>(options =>
                    options.UseSqlite(builder.Configuration.GetConnectionString("SQLiteConnection")));
                
                Console.WriteLine("Using SQLite database");
            }
            else
            {
                // Default to SQL Server
                builder.Services.AddDbContext<VMSDbContext>(options =>
                    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
                
                Console.WriteLine("Using SQL Server database");
            }

            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<IJwtService, JwtService>();
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured"))),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", builder =>
                {
                    builder.AllowAnyOrigin()
                           .AllowAnyMethod()
                           .AllowAnyHeader();
                });
            });


            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();
            app.UseCors("AllowAll");

            app.UseAuthentication();

            app.UseAuthorization();


            app.MapControllers();

            await SetupDatabase(app.Services);

            app.Run();

            async Task SetupDatabase(IServiceProvider serviceProvider)
            {
                using var scope = serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<VMSDbContext>();
                var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

                try
                {
                    // Check if we're using in-memory database (which doesn't support migrations)
                    if (configuration.GetValue<bool>("UseInMemoryDatabase"))
                    {
                        // In-memory database is created automatically
                        Console.WriteLine("Using in-memory database - no migrations needed");
                    }
                    else
                    {
                        // For SQLite or SQL Server, ensure database exists and apply migrations
                        Console.WriteLine("Checking database connection and applying migrations if needed...");
                        
                        // First check if we can connect to the database
                        if (await context.Database.CanConnectAsync())
                        {
                            Console.WriteLine("Successfully connected to the database");
                            
                            // Apply any pending migrations without recreating the database
                            await context.Database.MigrateAsync();
                            Console.WriteLine("Database migrations applied successfully");
                        }
                        else
                        {
                            Console.WriteLine("Cannot connect to the database. Creating a new database...");
                            // Only create the database if it doesn't exist, don't delete existing data
                            await context.Database.EnsureCreatedAsync();
                            Console.WriteLine("Database created successfully");
                        }
                    }

                    // Check if admin user exists
                    bool adminExists = await context.Users.AnyAsync(u => u.Username == "admin" && u.Email == "admin@system.com");
                    
                    // Only seed the admin user if it doesn't exist
                    if (!adminExists)
                    {
                        Console.WriteLine("Admin user not found. Creating default admin user...");
                        var adminUser = new User
                        {
                            Username = "admin",
                            Email = "admin@system.com",
                            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                            PhoneNumber = "01016928780",
                            Address = "Admin Address",
                            Role = "Admin",
                            CreatedAt = DateTime.Now
                        };
                        
                        context.Users.Add(adminUser);
                        await context.SaveChangesAsync();
                        Console.WriteLine("Default admin user created");
                    }
                    else
                    {
                        Console.WriteLine("Default admin user already exists");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"An error occurred while setting up the database: {ex.Message}");
                    Console.WriteLine("Inner exception: " + ex.InnerException?.Message);
                    Console.WriteLine("Stack trace: " + ex.StackTrace);
                    
                    // Don't try to recreate the database - this is likely causing data loss
                    Console.WriteLine("If this is a database connection issue, please check your connection string and database settings.");
                    
                    // Only create a new database as a last resort and only if explicitly configured
                    bool shouldCreateNewDb = configuration.GetValue<bool>("RecreateDbOnFailure");
                    if (shouldCreateNewDb && configuration.GetValue<bool>("UseSQLiteDatabase"))
                    {
                        try {
                            Console.WriteLine("WARNING: RecreateDbOnFailure is set to true. Attempting to recreate the database.");
                            // This is dangerous, so only do it when explicitly configured
                            await context.Database.EnsureCreatedAsync();
                            Console.WriteLine("Database recreated. All previous data has been lost.");
                            
                            // Add admin user after recreation
                            var adminUser = new User
                            {
                                Username = "admin",
                                Email = "admin@system.com",
                                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                                PhoneNumber = "01016928780",
                                Address = "Admin Address",
                                Role = "Admin",
                                CreatedAt = DateTime.Now
                            };
                            
                            context.Users.Add(adminUser);
                            await context.SaveChangesAsync();
                            Console.WriteLine("Admin user created after database recreation");
                        }
                        catch (Exception innerEx) {
                            Console.WriteLine($"Failed to recreate database: {innerEx.Message}");
                        }
                    }
                }
            }
        }
    }
}
