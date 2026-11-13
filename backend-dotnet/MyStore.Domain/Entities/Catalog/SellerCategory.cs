using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyStore.Domain.Entities;

[Table("seller_categories")]
public class SellerCategory
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("seller_id")]
    public ulong SellerId { get; set; }

    [Column("name")]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("slug")]
    [MaxLength(255)]
    public string Slug { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("icon")]
    [MaxLength(255)]
    public string? Icon { get; set; }

    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public Seller? Seller { get; set; }
    [JsonIgnore]
    public ICollection<Product> Products { get; set; } = new List<Product>();

    [NotMapped]
    public string? Image { get => Icon; set => Icon = value; }

    [NotMapped]
    public string Status { get => IsActive ? "active" : "inactive"; set => IsActive = value == "active"; }
}
