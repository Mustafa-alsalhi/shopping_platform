using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyStore.Domain.Entities;

[Table("drivers")]
public class Driver
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("user_id")]
    public ulong UserId { get; set; }

    [Column("personal_photo")]
    public string? PersonalPhoto { get; set; }

    [Column("emergency_contact_phone")]
    [MaxLength(30)]
    public string? EmergencyContactPhone { get; set; }

    [Column("vehicle_type")]
    [MaxLength(50)]
    public string? VehicleType { get; set; } // motorcycle, car, van

    [Column("vehicle_plate_number")]
    [MaxLength(50)]
    public string? VehiclePlateNumber { get; set; }

    [Column("id_card_image")]
    public string? IdCardImage { get; set; }

    [Column("kuraimi_account")]
    [MaxLength(100)]
    public string? KuraimiAccount { get; set; }

    [Column("is_verified")]
    public bool IsVerified { get; set; } = true;

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [JsonIgnore]
    public User? User { get; set; }

    [NotMapped]
    public string? VehicleNumber { get => VehiclePlateNumber; set => VehiclePlateNumber = value; }

    [NotMapped]
    public string? LicenseNumber { get; set; }

    [NotMapped]
    public string? NationalId { get; set; }

    [NotMapped]
    public string Status { get; set; } = "offline";

    [NotMapped]
    public string? CurrentLocation { get; set; }

    [NotMapped]
    public string? LicenseImage { get => PersonalPhoto; set => PersonalPhoto = value; }

    [NotMapped]
    public string? IdImage { get => IdCardImage; set => IdCardImage = value; }

    [NotMapped]
    public int CompletedDeliveries { get; set; }

    [NotMapped]
    public int TotalDeliveries { get; set; }

    [NotMapped]
    public decimal TotalEarnings { get; set; }
}
