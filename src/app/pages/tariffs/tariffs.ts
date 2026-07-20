import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

import { TariffService, Tariff } from '../../services/tariff';
import { AddonService } from '../../services/addon.service';
import { DeviceService } from '../../services/device.service';
import { AddonPackage } from '../../models/addon-package';
import { Device, DEVICE_CATEGORY_LABELS, DeviceCategory } from '../../models/device';
import { MoneyPipe } from '../../pipes/money.pipe';
import { catalogImageUrl, onCatalogImageError } from '../../utils/catalog-image.util';

@Component({
  selector: 'app-tariffs',
  standalone: true,
  imports: [CommonModule, MoneyPipe],
  templateUrl: './tariffs.html',
  styleUrl: './tariffs.css'
})
export class TariffsComponent implements OnInit {

  tariffs: Tariff[] = [];
  addons: AddonPackage[] = [];
  devices: Device[] = [];
  selectedDeviceCategory: DeviceCategory | 'ALL' = 'ALL';

  isLoading = true;
  loadError = '';

  readonly categoryLabels = DEVICE_CATEGORY_LABELS;
  readonly deviceCategories: DeviceCategory[] = [
    'PHONE', 'TABLET', 'HEADPHONE', 'LAPTOP', 'DESKTOP', 'WEARABLE'
  ];

  catalogImageUrl = catalogImageUrl;
  onImageError = onCatalogImageError;

  constructor(
    private tariffService: TariffService,
    private addonService: AddonService,
    private deviceService: DeviceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPageData();
  }

  loadPageData(): void {
    this.isLoading = true;
    this.loadError = '';

    forkJoin({
      tariffs: this.tariffService.fetchTariffs(),
      addons: this.addonService.fetchAddons(),
      devices: this.deviceService.fetchDevices()
    }).subscribe({
      next: ({ tariffs, addons, devices }) => {
        this.tariffs = tariffs ?? [];
        this.addons = addons ?? [];
        this.devices = devices ?? [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Tarife/ek paket/cihaz yukleme hatasi', err);
        this.tariffs = [];
        this.addons = [];
        this.devices = [];
        this.isLoading = false;
        this.loadError = 'Veriler yuklenemedi. Lutfen sayfayi yenileyin.';
        this.cdr.detectChanges();
      }
    });
  }

  getStreamingAddons(): AddonPackage[] {
    return this.addons.filter(addon => addon.type === 'STREAMING');
  }

  getOtherAddons(): AddonPackage[] {
    return this.addons.filter(addon => addon.type !== 'STREAMING');
  }

  selectDeviceCategory(category: DeviceCategory | 'ALL'): void {
    this.selectedDeviceCategory = category;
  }

  getFilteredDevices(): Device[] {
    if (this.selectedDeviceCategory === 'ALL') {
      return this.devices;
    }
    return this.devices.filter(
      device => device.category === this.selectedDeviceCategory
    );
  }

  tariffTypeLabel(type: string): string {
    if (type === 'MOBILE') {
      return 'Mobil';
    }
    if (type === 'FIBER') {
      return 'Fiber';
    }
    return type;
  }

}
