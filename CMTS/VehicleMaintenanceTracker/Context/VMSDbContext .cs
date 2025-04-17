using Microsoft.EntityFrameworkCore;
using VehicleMaintenanceTracker.Modules;

namespace VehicleMaintenanceTracker.Context
{
    public class VMSDbContext : DbContext
    {
        public VMSDbContext(DbContextOptions<VMSDbContext> options) : base(options)
        {
        }
        public DbSet<User> Users { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<OdometerReading> OdometerReadings { get; set; }
        public DbSet<MaintenanceService> MaintenanceServices { get; set; }
        public DbSet<MaintenanceRequest> MaintenanceRequests { get; set; }
        public DbSet<MaintenanceRequestService> MaintenanceRequestServices { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>().HasKey(u => u.UserId);
            modelBuilder.Entity<Vehicle>().HasKey(v => v.VehicleId);
            modelBuilder.Entity<OdometerReading>().HasKey(o => o.ReadingId);
            modelBuilder.Entity<MaintenanceService>().HasKey(s => s.ServiceId);
            modelBuilder.Entity<MaintenanceRequest>().HasKey(r => r.RequestId);
            modelBuilder.Entity<MaintenanceRequestService>().HasKey(rs => rs.RequestServiceId);

            modelBuilder.Entity<Vehicle>()
                .HasOne(v => v.User)
                .WithMany(u => u.Vehicles)
                .HasForeignKey(v => v.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OdometerReading>()
                .HasOne(o => o.Vehicle)
                .WithMany(v => v.OdometerReadings)
                .HasForeignKey(o => o.VehicleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MaintenanceRequest>()
                .HasOne(r => r.Vehicle)
                .WithMany(v => v.MaintenanceRequests)
                .HasForeignKey(r => r.VehicleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MaintenanceRequest>()
                .HasOne(r => r.OdometerReading)
                .WithOne(o => o.MaintenanceRequest)
                .HasForeignKey<MaintenanceRequest>(r => r.OdometerReadingId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MaintenanceRequestService>()
                .HasOne(rs => rs.MaintenanceRequest)
                .WithMany(r => r.MaintenanceRequestServices)
                .HasForeignKey(rs => rs.RequestId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MaintenanceRequestService>()
                .HasOne(rs => rs.MaintenanceService)
                .WithMany(s => s.MaintenanceRequestServices)
                .HasForeignKey(rs => rs.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MaintenanceService>()
       .Property(s => s.ServiceCost)
       .HasPrecision(18, 2);

            modelBuilder.Entity<User>()
                .Property(u => u.Username)
                .IsRequired();

            modelBuilder.Entity<User>()
                .Property(u => u.Email)
                .IsRequired();

            modelBuilder.Entity<Vehicle>()
                .Property(v => v.LicensePlateNumber)
                .IsRequired();

            modelBuilder.Entity<MaintenanceService>()
                .Property(s => s.ServiceName)
                .IsRequired();
        }
    }
}
   
