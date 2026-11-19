using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyStore.Domain.Entities;

namespace MyStore.Infrastructure.Persistence.Configurations.Catalog;

public class SellerCategoryConfiguration : IEntityTypeConfiguration<SellerCategory>
{
    public void Configure(EntityTypeBuilder<SellerCategory> builder)
    {
        builder.HasIndex(sc => sc.SellerId);
        builder.HasOne(sc => sc.Seller)
            .WithMany(s => s.SellerCategories)
            .HasForeignKey(sc => sc.SellerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
