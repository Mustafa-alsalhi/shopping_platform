using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyStore.Domain.Entities;

namespace MyStore.Infrastructure.Persistence.Configurations.Users;

public class SellerConfiguration : IEntityTypeConfiguration<Seller>
{
    public void Configure(EntityTypeBuilder<Seller> builder)
    {
        builder.HasIndex(s => s.Status);
        builder.HasIndex(s => s.Type);
        builder.Property(s => s.Rating).HasPrecision(3, 2);
        builder.Property(s => s.MinOrderAmount).HasPrecision(10, 2);
        builder.Property(s => s.Latitude).HasPrecision(10, 7);
        builder.Property(s => s.Longitude).HasPrecision(10, 7);
    }
}
