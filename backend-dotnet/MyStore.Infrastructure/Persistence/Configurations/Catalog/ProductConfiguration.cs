using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyStore.Domain.Entities;

namespace MyStore.Infrastructure.Persistence.Configurations.Catalog;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasIndex(p => p.Slug);
        builder.HasIndex(p => p.Sku);
        builder.HasIndex(p => p.CategoryId);
        builder.HasIndex(p => p.SellerId);
        builder.HasIndex(p => p.IsActive);
        builder.HasIndex(p => p.IsFeatured);
        builder.Property(p => p.Price).HasPrecision(10, 2);
        builder.Property(p => p.SalePrice).HasPrecision(10, 2);
        builder.Property(p => p.CompareAtPrice).HasPrecision(10, 2);
        builder.Property(p => p.Rating).HasPrecision(3, 2);
        builder.Property(p => p.SellerRating).HasPrecision(3, 2);

        builder.HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Seller)
            .WithMany(s => s.Products)
            .HasForeignKey(p => p.SellerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(p => p.SellerCategory)
            .WithMany(sc => sc.Products)
            .HasForeignKey(p => p.SellerCategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(p => p.Tax)
            .WithMany()
            .HasForeignKey(p => p.TaxId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
