using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyStore.Domain.Entities;

[Table("product_variants")]
public class ProductVariant
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("product_id")]
    public ulong ProductId { get; set; }

    [Column("name")]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("price")]
    public decimal? Price { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public Product? Product { get; set; }
    public ICollection<VariantOption> Options { get; set; } = new List<VariantOption>();

    [NotMapped]
    public string Type { get; set; } = "select";

    [NotMapped]
    public int Position { get; set; } = 0;
}
