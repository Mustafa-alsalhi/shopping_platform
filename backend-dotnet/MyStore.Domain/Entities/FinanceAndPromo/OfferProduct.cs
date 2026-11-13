using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyStore.Domain.Entities;

[Table("offer_products")]
public class OfferProduct
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("offer_id")]
    public ulong OfferId { get; set; }

    [Column("product_id")]
    public ulong ProductId { get; set; }

    [Column("special_price")]
    public decimal? SpecialPrice { get; set; }

    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public Offer? Offer { get; set; }
    public Product? Product { get; set; }
}
