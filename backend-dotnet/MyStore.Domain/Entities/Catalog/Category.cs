using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyStore.Domain.Entities;

[Table("categories")]
public class Category
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("name")]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("type")]
    [MaxLength(50)]
    public string Type { get; set; } = "store";

    [Column("slug")]
    [MaxLength(255)]
    public string Slug { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("image")]
    public string? Image { get; set; }

    [Column("image_url")]
    public string? ImageUrl { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("show_on_homepage")]
    public bool ShowOnHomepage { get; set; } = false;

    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;

    [Column("parent_id")]
    public ulong? ParentId { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [JsonIgnore]
    public Category? Parent { get; set; }
    public ICollection<Category> Children { get; set; } = new List<Category>();
    [JsonIgnore]
    public ICollection<Product> Products { get; set; } = new List<Product>();

    [NotMapped]
    public string Status { get => IsActive ? "active" : "inactive"; set => IsActive = value == "active"; }

    [NotMapped]
    public bool Featured { get => ShowOnHomepage; set => ShowOnHomepage = value; }
}
