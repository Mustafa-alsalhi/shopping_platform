using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Infrastructure.Services;

public class DeliveryService : IDeliveryService
{
    private readonly IConfiguration _configuration;

    public DeliveryService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (double DistanceKm, decimal Fee) CalculateFee(decimal? customerLat, decimal? customerLng, decimal? sellerLat, decimal? sellerLng)
    {
        var baseFee = decimal.TryParse(_configuration["Delivery:BaseFee"], out var bf) ? bf : 15m;
        var baseDistance = double.TryParse(_configuration["Delivery:BaseDistanceKm"], out var bd) ? bd : 5.0;
        var pricePerKm = decimal.TryParse(_configuration["Delivery:PricePerKm"], out var ppk) ? ppk : 2m;

        if (!customerLat.HasValue || !customerLng.HasValue || !sellerLat.HasValue || !sellerLng.HasValue)
        {
            return (0, baseFee);
        }

        var distance = CalculateDistanceKm((double)customerLat.Value, (double)customerLng.Value, (double)sellerLat.Value, (double)sellerLng.Value);
        var fee = baseFee;

        if (distance > baseDistance)
        {
            var extraDistance = (decimal)Math.Ceiling(distance - baseDistance);
            fee += extraDistance * pricePerKm;
        }

        return (Math.Round(distance, 1), fee);
    }

    public (double DistanceKm, decimal DeliveryFee, string Currency) CalculateFee(double lat1, double lng1, double lat2, double lng2)
    {
        var res = CalculateFee((decimal?)lat2, (decimal?)lng2, (decimal?)lat1, (decimal?)lng1);
        return (res.DistanceKm, res.Fee, "SAR");
    }

    public double CalculateDistanceKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadius = 6371.0; // km
        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return earthRadius * c;
    }

    private static double DegreesToRadians(double deg) => deg * (Math.PI / 180.0);
}
