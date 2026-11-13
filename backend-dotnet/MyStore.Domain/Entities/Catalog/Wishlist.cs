using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyStore.Domain.Entities;

[Table("wishlists")]
public class Wishlist
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("user_id")]
    public ulong UserId { get; set; }

    [Column("product_id")]
    public ulong ProductId { get; set; }

    [Column("product_name")]
    public string? ProductName { get; set; }

    [Column("price")]
    public decimal? Price { get; set; }

    [Column("image_url")]
    public string? ImageUrl { get; set; }

    [Column("sku")]
    public string? Sku { get; set; }

    [Column("weight")]
    public string? Weight { get; set; }

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
    public string? Status { get; set; }

    [Column("featured")]
    public bool? Featured { get; set; }

    [Column("variant_attributes")]
    public string? VariantAttributes { get; set; }

    [Column("currency")]
    public string? Currency { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public Product? Product { get; set; }
}
