using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyStore.Domain.Entities;

namespace MyStore.Infrastructure.Persistence.Configurations.OrderAndCart;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasIndex(o => o.OrderNumber).IsUnique();
        builder.HasIndex(o => o.Status);
        builder.HasIndex(o => o.DriverId);
        builder.Property(o => o.TotalAmount).HasPrecision(10, 2);
        builder.Property(o => o.Subtotal).HasPrecision(10, 2);
        builder.Property(o => o.Tax).HasPrecision(10, 2);
        builder.Property(o => o.Shipping).HasPrecision(10, 2);
        builder.Property(o => o.Latitude).HasPrecision(10, 7);
        builder.Property(o => o.Longitude).HasPrecision(10, 7);

        builder.HasOne(o => o.User)
            .WithMany(u => u.Orders)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(o => o.Driver)
            .WithMany(u => u.DriverOrders)
            .HasForeignKey(o => o.DriverId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
