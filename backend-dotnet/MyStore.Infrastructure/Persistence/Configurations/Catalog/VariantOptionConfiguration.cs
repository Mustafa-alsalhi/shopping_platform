using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyStore.Domain.Entities;

namespace MyStore.Infrastructure.Persistence.Configurations.Catalog;

public class VariantOptionConfiguration : IEntityTypeConfiguration<VariantOption>
{
    public void Configure(EntityTypeBuilder<VariantOption> builder)
    {
        builder.Property(vo => vo.Price).HasPrecision(10, 2);
        builder.HasOne(vo => vo.Variant)
            .WithMany(pv => pv.Options)
            .HasForeignKey(vo => vo.ProductVariantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
