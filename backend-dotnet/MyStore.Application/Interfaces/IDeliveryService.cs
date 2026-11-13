using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using MyStore.Domain.Entities;

namespace MyStore.Application.Interfaces;

public interface IDeliveryService
{
    (double DistanceKm, decimal Fee) CalculateFee(decimal? customerLat, decimal? customerLng, decimal? sellerLat, decimal? sellerLng);
    (double DistanceKm, decimal DeliveryFee, string Currency) CalculateFee(double lat1, double lng1, double lat2, double lng2);
    double CalculateDistanceKm(double lat1, double lon1, double lat2, double lon2);
}
