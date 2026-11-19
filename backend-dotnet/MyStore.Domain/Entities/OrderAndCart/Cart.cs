using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyStore.Domain.Entities;

[Table("carts")]
public class Cart
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("user_id")]
    public ulong UserId { get; set; }

    [Column("product_id")]
    public ulong ProductId { get; set; }

    [Column("product_variant_id")]
    public ulong? ProductVariantId { get; set; }

    [Column("quantity")]
    public int Quantity { get; set; } = 1;

    [Column("product_name")]
    public string? ProductName { get; set; }

    [Column("price")]
    public decimal? Price { get; set; }

    [Column("image_url")]
    public string? ImageUrl { get; set; }

    [Column("sku")]
    public string? Sku { get; set; }

    [Column("weight")]
    public decimal? Weight { get; set; }

    [Column("dimensions")]
    public string? Dimensions { get; set; }

    [Column("category")]
    public string? Category { get; set; }

    [Column("brand")]
    public string? Brand { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("short_description")]
    public string? ShortDescription { get; set; }

    [Column("status")]
    public string? Status { get; set; } = "active";

    [Column("featured")]
    public bool Featured { get; set; } = false;

    [Column("variant_attributes")]
    public string? VariantAttributes { get; set; }

    [Column("currency")]
    [MaxLength(10)]
    public string? Currency { get; set; }

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
    public string? SelectedOptions { get; set; } // JSON array

    [Column("special_instructions")]
    public string? SpecialInstructions { get; set; }

    [Column("seller_type")]
    [MaxLength(50)]
    public string? SellerType { get; set; } = "store";

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User? User { get; set; }
    public Product? Product { get; set; }
    public ProductVariant? Variant { get; set; }

    [NotMapped]
    public decimal? UnitPrice { get => Price; set => Price = value; }
}
