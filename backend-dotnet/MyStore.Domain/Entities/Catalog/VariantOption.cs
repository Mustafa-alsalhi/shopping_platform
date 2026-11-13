using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyStore.Domain.Entities;

[Table("variant_options")]
public class VariantOption
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("product_variant_id")]
    public ulong ProductVariantId { get; set; }

    [Column("name")]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("price")]
    public decimal? Price { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ProductVariant? Variant { get; set; }

    [NotMapped]
    public ulong VariantId { get => ProductVariantId; set => ProductVariantId = value; }

    [NotMapped]
    public string Value { get => Name; set => Name = value; }

    [NotMapped]
    public decimal PriceDelta { get => Price ?? 0m; set => Price = value; }

    [NotMapped]
    public int? Stock { get; set; }

    [NotMapped]
    public string? ColorCode { get; set; }

    [NotMapped]
    public string? Image { get; set; }

    [NotMapped]
    public string? Sku { get; set; }

    [NotMapped]
    public int Position { get; set; }
}
