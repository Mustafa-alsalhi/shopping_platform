using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyStore.Domain.Entities;

[Table("order_items")]
public class OrderItem
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("order_id")]
    public ulong OrderId { get; set; }

    [Column("product_id")]
    public ulong ProductId { get; set; }

    [Column("product_variant_id")]
    public ulong? ProductVariantId { get; set; }

    [Column("product_name")]
    [MaxLength(255)]
    public string ProductName { get; set; } = string.Empty;

    [Column("product_sku")]
    [MaxLength(100)]
    public string ProductSku { get; set; } = string.Empty;

    [Column("quantity")]
    public int Quantity { get; set; }

    [Column("price")]
    public decimal Price { get; set; }

    [Column("total")]
    public decimal Total { get; set; }

    [Column("image_url")]
    public string? ImageUrl { get; set; }

    [Column("color")]
    public string? Color { get; set; }

    [Column("color_code")]
    public string? ColorCode { get; set; }

    [Column("size")]
    public string? Size { get; set; }

    [Column("variant_name")]
    public string? VariantName { get; set; }

    [Column("variant_value")]
    public string? VariantValue { get; set; }

    [Column("selected_image_index")]
    public int? SelectedImageIndex { get; set; }

    [Column("selected_options")]
    public string? SelectedOptions { get; set; } // JSON

    [Column("special_instructions")]
    public string? SpecialInstructions { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [JsonIgnore]
    public Order? Order { get; set; }
    public Product? Product { get; set; }
    public ProductVariant? Variant { get; set; }

    [NotMapped]
    public ulong? SellerId { get; set; }
}
