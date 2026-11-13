using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Seller> Sellers => Set<Seller>();
    public DbSet<Driver> Drivers => Set<Driver>();
    public DbSet<AdminAudit> AdminAudits => Set<AdminAudit>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<SellerCategory> SellerCategories => Set<SellerCategory>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<VariantOption> VariantOptions => Set<VariantOption>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Wishlist> Wishlists => Set<Wishlist>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Offer> Offers => Set<Offer>();
    public DbSet<OfferProduct> OfferProducts => Set<OfferProduct>();
    public DbSet<Tax> Taxes => Set<Tax>();
    public DbSet<ShippingCompany> ShippingCompanies => Set<ShippingCompany>();
    public DbSet<PaymentMethod> PaymentMethods => Set<PaymentMethod>();
    public DbSet<PaymentRequest> PaymentRequests => Set<PaymentRequest>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Banner> Banners => Set<Banner>();
    public DbSet<Setting> Settings => Set<Setting>();
    public DbSet<Policy> Policies => Set<Policy>();
    public DbSet<AboutUs> AboutUs => Set<AboutUs>();
    public DbSet<ContactUs> ContactUs => Set<ContactUs>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. User relationships & indexes
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email);
            e.HasIndex(u => u.Phone);
            e.HasIndex(u => u.Role);
            e.Property(u => u.Latitude).HasPrecision(10, 7);
            e.Property(u => u.Longitude).HasPrecision(10, 7);

            e.HasOne(u => u.Seller)
                .WithOne(s => s.User)
                .HasForeignKey<Seller>(s => s.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(u => u.Driver)
                .WithOne(d => d.User)
                .HasForeignKey<Driver>(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 2. Seller
        modelBuilder.Entity<Seller>(e =>
        {
            e.HasIndex(s => s.Status);
            e.HasIndex(s => s.Type);
            e.Property(s => s.Rating).HasPrecision(3, 2);
            e.Property(s => s.MinOrderAmount).HasPrecision(10, 2);
            e.Property(s => s.Latitude).HasPrecision(10, 7);
            e.Property(s => s.Longitude).HasPrecision(10, 7);
        });

        // 3. AdminAudit
        modelBuilder.Entity<AdminAudit>(e =>
        {
            e.HasIndex(a => a.AdminId);
            e.HasIndex(a => a.Action);
            e.HasIndex(a => a.CreatedAt);
            e.HasOne(a => a.Admin)
                .WithMany()
                .HasForeignKey(a => a.AdminId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 4. Activity
        modelBuilder.Entity<Activity>(e =>
        {
            e.HasIndex(a => a.Slug).IsUnique();
            e.HasIndex(a => a.IsActive);
        });

        // 5. Category
        modelBuilder.Entity<Category>(e =>
        {
            e.HasIndex(c => c.Slug).IsUnique();
            e.HasIndex(c => c.Type);
            e.HasOne(c => c.Parent)
                .WithMany(c => c.Children)
                .HasForeignKey(c => c.ParentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // 6. SellerCategory
        modelBuilder.Entity<SellerCategory>(e =>
        {
            e.HasIndex(sc => sc.SellerId);
            e.HasOne(sc => sc.Seller)
                .WithMany(s => s.SellerCategories)
                .HasForeignKey(sc => sc.SellerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 7. Product
        modelBuilder.Entity<Product>(e =>
        {
            e.HasIndex(p => p.Slug);
            e.HasIndex(p => p.Sku);
            e.HasIndex(p => p.CategoryId);
            e.HasIndex(p => p.SellerId);
            e.HasIndex(p => p.IsActive);
            e.HasIndex(p => p.IsFeatured);
            e.Property(p => p.Price).HasPrecision(10, 2);
            e.Property(p => p.SalePrice).HasPrecision(10, 2);
            e.Property(p => p.CompareAtPrice).HasPrecision(10, 2);
            e.Property(p => p.Rating).HasPrecision(3, 2);
            e.Property(p => p.SellerRating).HasPrecision(3, 2);

            e.HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(p => p.Seller)
                .WithMany(s => s.Products)
                .HasForeignKey(p => p.SellerId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(p => p.SellerCategory)
                .WithMany(sc => sc.Products)
                .HasForeignKey(p => p.SellerCategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(p => p.Tax)
                .WithMany()
                .HasForeignKey(p => p.TaxId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // 8. ProductVariant & VariantOption
        modelBuilder.Entity<ProductVariant>(e =>
        {
            e.Property(pv => pv.Price).HasPrecision(10, 2);
            e.HasOne(pv => pv.Product)
                .WithMany(p => p.ProductVariants)
                .HasForeignKey(pv => pv.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<VariantOption>(e =>
        {
            e.Property(vo => vo.Price).HasPrecision(10, 2);
            e.HasOne(vo => vo.Variant)
                .WithMany(pv => pv.Options)
                .HasForeignKey(vo => vo.ProductVariantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 9. Review & Wishlist & Cart
        modelBuilder.Entity<Review>(e =>
        {
            e.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(r => r.Product).WithMany(p => p.Reviews).HasForeignKey(r => r.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Wishlist>(e =>
        {
            e.HasIndex(w => new { w.UserId, w.ProductId }).IsUnique();
            e.Property(w => w.Price).HasPrecision(10, 2);
            e.HasOne(w => w.User).WithMany().HasForeignKey(w => w.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(w => w.Product).WithMany().HasForeignKey(w => w.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Cart>(e =>
        {
            e.Property(c => c.Price).HasPrecision(10, 2);
            e.HasOne(c => c.User).WithMany().HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(c => c.Product).WithMany().HasForeignKey(c => c.ProductId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(c => c.Variant).WithMany().HasForeignKey(c => c.ProductVariantId).OnDelete(DeleteBehavior.SetNull);
        });

        // 10. Order & OrderItem
        modelBuilder.Entity<Order>(e =>
        {
            e.HasIndex(o => o.OrderNumber).IsUnique();
            e.HasIndex(o => o.Status);
            e.HasIndex(o => o.DriverId);
            e.Property(o => o.TotalAmount).HasPrecision(10, 2);
            e.Property(o => o.Subtotal).HasPrecision(10, 2);
            e.Property(o => o.Tax).HasPrecision(10, 2);
            e.Property(o => o.Shipping).HasPrecision(10, 2);
            e.Property(o => o.Latitude).HasPrecision(10, 7);
            e.Property(o => o.Longitude).HasPrecision(10, 7);

            e.HasOne(o => o.User)
                .WithMany(u => u.Orders)
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(o => o.Driver)
                .WithMany(u => u.DriverOrders)
                .HasForeignKey(o => o.DriverId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<OrderItem>(e =>
        {
            e.Property(oi => oi.Price).HasPrecision(10, 2);
            e.Property(oi => oi.Total).HasPrecision(10, 2);
            e.HasOne(oi => oi.Order)
                .WithMany(o => o.Items)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(oi => oi.Product)
                .WithMany()
                .HasForeignKey(oi => oi.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(oi => oi.Variant)
                .WithMany()
                .HasForeignKey(oi => oi.ProductVariantId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // 11. Coupons, Offers, Taxes, Shipping, Payments
        modelBuilder.Entity<Coupon>(e =>
        {
            e.HasIndex(c => c.Code).IsUnique();
            e.Property(c => c.Value).HasPrecision(10, 2);
            e.Property(c => c.MinimumAmount).HasPrecision(10, 2);
            e.Property(c => c.MaximumDiscount).HasPrecision(10, 2);
            e.HasOne(c => c.Seller).WithMany().HasForeignKey(c => c.SellerId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Offer>(e =>
        {
            e.HasIndex(o => o.Slug).IsUnique();
            e.Property(o => o.DiscountValue).HasPrecision(10, 2);
            e.HasOne(o => o.Seller).WithMany().HasForeignKey(o => o.SellerId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OfferProduct>(e =>
        {
            e.HasIndex(op => new { op.OfferId, op.ProductId }).IsUnique();
            e.Property(op => op.SpecialPrice).HasPrecision(10, 2);
            e.HasOne(op => op.Offer).WithMany(o => o.OfferProducts).HasForeignKey(op => op.OfferId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(op => op.Product).WithMany(p => p.OfferProducts).HasForeignKey(op => op.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Tax>(e =>
        {
            e.Property(t => t.Rate).HasPrecision(10, 2);
        });

        modelBuilder.Entity<ShippingCompany>(e =>
        {
            e.Property(sc => sc.Cost).HasPrecision(10, 2);
        });

        modelBuilder.Entity<PaymentMethod>(e =>
        {
            e.Property(pm => pm.Fee).HasPrecision(10, 2);
        });

        modelBuilder.Entity<PaymentRequest>(e =>
        {
            e.Property(pr => pr.PaymentAmount).HasPrecision(10, 2);
            e.Property(pr => pr.PaymentFee).HasPrecision(10, 2);
            e.HasOne(pr => pr.Order).WithMany(o => o.PaymentRequests).HasForeignKey(pr => pr.OrderId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(pr => pr.User).WithMany().HasForeignKey(pr => pr.UserId).OnDelete(DeleteBehavior.SetNull);
        });

        // 12. Messages & Notifications
        modelBuilder.Entity<Message>(e =>
        {
            e.HasOne(m => m.Seller).WithMany().HasForeignKey(m => m.SellerId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(m => m.Customer).WithMany().HasForeignKey(m => m.CustomerId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(m => m.Order).WithMany().HasForeignKey(m => m.OrderId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(m => m.Product).WithMany().HasForeignKey(m => m.ProductId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Notification>(e =>
        {
            e.HasOne(n => n.User).WithMany().HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
