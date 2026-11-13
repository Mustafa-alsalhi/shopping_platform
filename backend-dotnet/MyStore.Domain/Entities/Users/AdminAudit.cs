using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyStore.Domain.Entities;

[Table("admin_audits")]
public class AdminAudit
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("admin_id")]
    public ulong AdminId { get; set; }

    [Column("action")]
    [MaxLength(20)]
    public string Action { get; set; } = string.Empty;

    [Column("path")]
    [MaxLength(255)]
    public string Path { get; set; } = string.Empty;

    [Column("ip_address")]
    [MaxLength(45)]
    public string IpAddress { get; set; } = string.Empty;

    [Column("user_agent")]
    public string UserAgent { get; set; } = string.Empty;

    [Column("details")]
    public string? Details { get; set; } // JSON

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? Admin { get; set; }
}
