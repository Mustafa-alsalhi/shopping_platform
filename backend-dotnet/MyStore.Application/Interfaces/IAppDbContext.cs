using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using MyStore.Domain.Entities;

namespace MyStore.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Seller> Sellers { get; }
    DbSet<Driver> Drivers { get; }
    DbSet<AdminAudit> AdminAudits { get; }
    DbSet<Activity> Activities { get; }
    DbSet<Category> Categories { get; }
    DbSet<SellerCategory> SellerCategories { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductVariant> ProductVariants { get; }
    DbSet<VariantOption> VariantOptions { get; }
    DbSet<Review> Reviews { get; }
    DbSet<Wishlist> Wishlists { get; }
    DbSet<Cart> Carts { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<Coupon> Coupons { get; }
    DbSet<Offer> Offers { get; }
    DbSet<OfferProduct> OfferProducts { get; }
    DbSet<Tax> Taxes { get; }
    DbSet<ShippingCompany> ShippingCompanies { get; }
    DbSet<PaymentMethod> PaymentMethods { get; }
    DbSet<PaymentRequest> PaymentRequests { get; }
    DbSet<Message> Messages { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<Banner> Banners { get; }
    DbSet<Setting> Settings { get; }
    DbSet<Policy> Policies { get; }
    DbSet<AboutUs> AboutUs { get; }
    DbSet<ContactUs> ContactUs { get; }
    DbSet<AboutUs> AboutUsPages => AboutUs;
    DbSet<ContactUs> ContactUsMessages => ContactUs;

    DatabaseFacade Database { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
