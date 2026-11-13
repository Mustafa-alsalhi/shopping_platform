using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Api.Features.Auth.Dtos;

public class RegisterSellerFormRequest
{
    [FromForm(Name = "store_name")]
    public string StoreName { get; set; } = string.Empty;

    [FromForm(Name = "description")]
    public string? Description { get; set; }

    [FromForm(Name = "address")]
    public string Address { get; set; } = string.Empty;

    [FromForm(Name = "city")]
    public string City { get; set; } = string.Empty;

    [FromForm(Name = "latitude")]
    public decimal? Latitude { get; set; }

    [FromForm(Name = "longitude")]
    public decimal? Longitude { get; set; }

    [FromForm(Name = "kuraimi_account_name")]
    public string? KuraimiAccountName { get; set; }

    [FromForm(Name = "kuraimi_account_number")]
    public string? KuraimiAccountNumber { get; set; }

    [FromForm(Name = "alt_network_name")]
    public string? AltNetworkName { get; set; }

    [FromForm(Name = "alt_recipient_name")]
    public string? AltRecipientName { get; set; }

    [FromForm(Name = "alt_recipient_phone")]
    public string? AltRecipientPhone { get; set; }

    [FromForm(Name = "first_name")]
    public string? FirstName { get; set; }

    [FromForm(Name = "last_name")]
    public string? LastName { get; set; }

    [FromForm(Name = "phone")]
    public string? Phone { get; set; }

    [FromForm(Name = "email")]
    public string? Email { get; set; }

    [FromForm(Name = "password")]
    public string? Password { get; set; }

    [FromForm(Name = "avatar_file")]
    public IFormFile? AvatarFile { get; set; }

    [FromForm(Name = "id_card_image_file")]
    public IFormFile? IdCardImageFile { get; set; }

    [FromForm(Name = "commercial_register_image_file")]
    public IFormFile? CommercialRegisterImageFile { get; set; }

    [FromForm(Name = "signed_contract_image_file")]
    public IFormFile? SignedContractImageFile { get; set; }
}
