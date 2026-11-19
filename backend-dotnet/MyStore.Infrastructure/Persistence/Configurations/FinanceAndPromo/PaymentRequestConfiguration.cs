using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyStore.Domain.Entities;

namespace MyStore.Infrastructure.Persistence.Configurations.FinanceAndPromo;

public class PaymentRequestConfiguration : IEntityTypeConfiguration<PaymentRequest>
{
    public void Configure(EntityTypeBuilder<PaymentRequest> builder)
    {
        builder.Property(pr => pr.PaymentAmount).HasPrecision(10, 2);
        builder.Property(pr => pr.PaymentFee).HasPrecision(10, 2);
        builder.HasOne(pr => pr.Order).WithMany(o => o.PaymentRequests).HasForeignKey(pr => pr.OrderId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(pr => pr.User).WithMany().HasForeignKey(pr => pr.UserId).OnDelete(DeleteBehavior.SetNull);
    }
}
