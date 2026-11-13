using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyStore.Domain.Entities;

[Table("products")]
public class Product
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("name")]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("slug")]
    [MaxLength(255)]
    public string Slug { get; set; } = string.Empty;

    [Column("description")]
    public string Description { get; set; } = string.Empty;

    [Column("detailed_description")]
    public string? DetailedDescription { get; set; }

    [Column("price")]
    public decimal Price { get; set; }

    [Column("sale_price")]
    public decimal? SalePrice { get; set; }

    [Column("compare_at_price")]
    public decimal? CompareAtPrice { get; set; }

    [Column("currency")]
    [MaxLength(10)]
    public string Currency { get; set; } = "YER";

    [Column("tax_id")]
    public ulong? TaxId { get; set; }

    [Column("condition")]
    [MaxLength(50)]
    public string Condition { get; set; } = "new";

    [Column("sale_start_date")]
    public DateTime? SaleStartDate { get; set; }

    [Column("sale_end_date")]
    public DateTime? SaleEndDate { get; set; }

    [Column("sku")]
    [MaxLength(100)]
    public string Sku { get; set; } = string.Empty;

    [Column("image_url")]
    public string ImageUrl { get; set; } = string.Empty;

    [Column("images")]
    public string? Images { get; set; } // JSON array

    [Column("gallery_images")]
    public string? GalleryImages { get; set; } // JSON array

    [Column("variants")]
    public string? VariantsJson { get; set; } // JSON array stored in products.variants column

    [Column("food_options")]
    public string? FoodOptions { get; set; } // JSON array

    [Column("preparation_time")]
    public int? PreparationTime { get; set; }

    [Column("category_id")]
    public ulong CategoryId { get; set; }

    [Column("seller_id")]
    public ulong? SellerId { get; set; }

    [Column("seller_name")]
    [MaxLength(255)]
    public string? SellerName { get; set; }

    [Column("seller_avatar")]
    public string? SellerAvatar { get; set; }

    [Column("seller_rating")]
    public decimal? SellerRating { get; set; }

    [Column("seller_reviews_count")]
    public int? SellerReviewsCount { get; set; }

    [Column("is_approved")]
    public bool IsApproved { get; set; } = true;

    [Column("seller_category_id")]
    public ulong? SellerCategoryId { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("is_featured")]
    public bool IsFeatured { get; set; } = false;

    [Column("stock")]
    public int Stock { get; set; } = 0;

    [Column("sold_count")]
    public int SoldCount { get; set; } = 0;

    [Column("rating")]
    public decimal Rating { get; set; } = 0;

    [Column("reviews_count")]
    public int ReviewsCount { get; set; } = 0;

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Category? Category { get; set; }
    public Tax? Tax { get; set; }
    public Seller? Seller { get; set; }
    public SellerCategory? SellerCategory { get; set; }
    public ICollection<ProductVariant> ProductVariants { get; set; } = new List<ProductVariant>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<OfferProduct> OfferProducts { get; set; } = new List<OfferProduct>();

    [NotMapped]
    public decimal? OldPrice { get => CompareAtPrice; set => CompareAtPrice = value; }

    [NotMapped]
    public string? Image { get => ImageUrl; set => ImageUrl = value ?? ""; }

    [NotMapped]
    public string? Brand { get; set; }

    [NotMapped]
    public decimal? Weight { get; set; }

    [NotMapped]
    public string? Dimensions { get; set; }

    [NotMapped]
    public string? Specifications { get => DetailedDescription; set => DetailedDescription = value; }

    [NotMapped]
    public string Status { get => IsActive ? "active" : "inactive"; set => IsActive = value == "active"; }

    [NotMapped]
    public bool Featured { get => IsFeatured; set => IsFeatured = value; }

    [NotMapped]
    public int? Calories { get; set; }

    [NotMapped]
    public string? Addons { get => FoodOptions; set => FoodOptions = value; }

    [NotMapped]
    public ICollection<ProductVariant> Variants { get => ProductVariants; set => ProductVariants = value; }
}
