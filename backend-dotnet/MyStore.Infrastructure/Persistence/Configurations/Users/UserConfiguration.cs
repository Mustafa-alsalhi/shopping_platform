using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyStore.Domain.Entities;

namespace MyStore.Infrastructure.Persistence.Configurations.Users;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasIndex(u => u.Email);
        builder.HasIndex(u => u.Phone);
        builder.HasIndex(u => u.Role);
        builder.Property(u => u.Latitude).HasPrecision(10, 7);
        builder.Property(u => u.Longitude).HasPrecision(10, 7);

        builder.HasOne(u => u.Seller)
            .WithOne(s => s.User)
            .HasForeignKey<Seller>(s => s.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(u => u.Driver)
            .WithOne(d => d.User)
            .HasForeignKey<Driver>(d => d.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
