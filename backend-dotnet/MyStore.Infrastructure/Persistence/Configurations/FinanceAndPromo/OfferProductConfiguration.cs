using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyStore.Domain.Entities;

namespace MyStore.Infrastructure.Persistence.Configurations.FinanceAndPromo;

public class OfferProductConfiguration : IEntityTypeConfiguration<OfferProduct>
{
    public void Configure(EntityTypeBuilder<OfferProduct> builder)
    {
        builder.HasIndex(op => new { op.OfferId, op.ProductId }).IsUnique();
        builder.Property(op => op.SpecialPrice).HasPrecision(10, 2);
        builder.HasOne(op => op.Offer).WithMany(o => o.OfferProducts).HasForeignKey(op => op.OfferId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(op => op.Product).WithMany(p => p.OfferProducts).HasForeignKey(op => op.ProductId).OnDelete(DeleteBehavior.Cascade);
    }
}
