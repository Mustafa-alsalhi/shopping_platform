import { Component, ElementRef, EventEmitter, Input, OnChanges, AfterViewInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700">{{ label }}</span>
        @if (!readonly) {
          <button
            type="button"
            (click)="locateMe()"
            class="text-xs px-3 py-1 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition font-semibold">
            📍 تحديد موقعي الحالي
          </button>
        }
      </div>
      <div #mapContainer class="w-full h-64 rounded-xl border border-amber-300 shadow-inner z-10"></div>
      @if (latitude && longitude) {
        <p class="text-xs text-gray-500">
          الإحداثيات: {{ latitude | number:'1.5-5' }}, {{ longitude | number:'1.5-5' }}
        </p>
      }
    </div>
  `
})
export class LocationPickerComponent implements AfterViewInit, OnChanges {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  @Input() label = 'حدد الموقع على الخريطة';
  @Input() latitude: number = 15.3694;
  @Input() longitude: number = 44.1910;
  @Input() readonly = false;

  @Output() locationChange = new EventEmitter<{ lat: number; lng: number }>();

  private map?: L.Map;
  private marker?: L.Marker;

  ngAfterViewInit(): void {
    const lat = this.latitude || 15.3694;
    const lng = this.longitude || 44.1910;

    this.map = L.map(this.mapContainer.nativeElement).setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });

    this.marker = L.marker([lat, lng], { draggable: !this.readonly, icon }).addTo(this.map);

    if (!this.readonly) {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.setCoordinates(e.latlng.lat, e.latlng.lng);
      });

      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.setCoordinates(pos.lat, pos.lng);
      });
    }

    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map && this.marker && (changes['latitude'] || changes['longitude'])) {
      const lat = this.latitude || 15.3694;
      const lng = this.longitude || 44.1910;
      this.marker.setLatLng([lat, lng]);
      this.map.setView([lat, lng], this.map.getZoom());
    }
  }

  locateMe(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      this.setCoordinates(pos.coords.latitude, pos.coords.longitude);
    });
  }

  private setCoordinates(lat: number, lng: number): void {
    this.latitude = lat;
    this.longitude = lng;
    if (this.marker && this.map) {
      this.marker.setLatLng([lat, lng]);
      this.map.panTo([lat, lng]);
    }
    this.locationChange.emit({ lat, lng });
  }
}

