using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyStore.Domain.Entities;

[Table("activities")]
public class Activity
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

    [Column("icon")]
    [MaxLength(255)]
    public string? Icon { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("banner_title")]
    [MaxLength(255)]
    public string? BannerTitle { get; set; }

    [Column("banner_subtitle")]
    [MaxLength(255)]
    public string? BannerSubtitle { get; set; }

    [Column("banner_bg")]
    [MaxLength(255)]
    public string? BannerBg { get; set; }

    [Column("banner_image")]
    public string? BannerImage { get; set; }

    [Column("place_label")]
    [MaxLength(100)]
    public string? PlaceLabel { get; set; }

    [Column("item_label")]
    [MaxLength(100)]
    public string? ItemLabel { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    [NotMapped]
    public string? Image { get => BannerImage; set => BannerImage = value; }

    [NotMapped]
    public string? ThemeColor { get => BannerBg; set => BannerBg = value; }

    [NotMapped]
    public bool IsSystem => Slug == "stores" || Slug == "restaurants" || Slug == "store" || Slug == "restaurant";
}
