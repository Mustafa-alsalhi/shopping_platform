using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyStore.Domain.Entities;

[Table("banners")]
public class Banner
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("title")]
    [MaxLength(255)]
    public string? Title { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("image_url")]
    public string ImageUrl { get; set; } = string.Empty;

    [Column("link_url")]
    public string? LinkUrl { get; set; }

    [Column("link_text")]
    [MaxLength(100)]
    public string? LinkText { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;

    [Column("position")]
    [MaxLength(50)]
    public string Position { get; set; } = "home";

    [Column("type")]
    [MaxLength(50)]
    public string Type { get; set; } = "store";

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    [NotMapped]
    public string? FullImageUrl => ImageUrl;
}
