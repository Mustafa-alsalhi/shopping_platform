using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyStore.Domain.Entities;

[Table("offers")]
public class Offer
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("seller_id")]
    public ulong? SellerId { get; set; }

    [Column("title")]
    [MaxLength(255)]
    public string Title { get; set; } = string.Empty;

    [Column("slug")]
    [MaxLength(255)]
    public string Slug { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("banner")]
    public string? Banner { get; set; }

    [Column("thumbnail")]
    public string? Thumbnail { get; set; }

    [Column("discount_type")]
    [MaxLength(50)]
    public string DiscountType { get; set; } = "percentage"; // percentage, fixed, free_shipping

    [Column("discount_value")]
    public decimal DiscountValue { get; set; } = 0;

    [Column("start_date")]
    public DateTime? StartDate { get; set; }

    [Column("end_date")]
    public DateTime? EndDate { get; set; }

    [Column("status")]
    [MaxLength(50)]
    public string Status { get; set; } = "active";

    [Column("show_in_home")]
    public bool ShowInHome { get; set; } = false;

    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    public Seller? Seller { get; set; }
    public ICollection<OfferProduct> OfferProducts { get; set; } = new List<OfferProduct>();

    [NotMapped]
    public int DiscountPercentage { get => (int)DiscountValue; set => DiscountValue = value; }

    [NotMapped]
    public decimal? OriginalPrice { get; set; }

    [NotMapped]
    public decimal? DiscountPrice { get; set; }

    [NotMapped]
    public string? Category { get => DiscountType; set => DiscountType = value ?? "percentage"; }

    [NotMapped]
    public string? Image { get => Banner ?? Thumbnail; set { Banner = value; Thumbnail = value; } }

    [NotMapped]
    public DateTime? ValidUntil { get => EndDate; set => EndDate = value; }

    [NotMapped]
    public bool Featured { get => ShowInHome; set => ShowInHome = value; }

    [NotMapped]
    public bool LimitedTime { get; set; }

    [NotMapped]
    public bool Active { get => Status == "active"; set => Status = value ? "active" : "inactive"; }
}
