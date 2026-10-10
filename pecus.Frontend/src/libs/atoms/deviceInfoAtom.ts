import { atom } from 'jotai';
import type { DeviceType, OsPlatform as OSPlatform } from '@/connectors/hey-api-axios/types.gen';

export interface DeviceInfo {
  deviceName: string;
  deviceType: DeviceType;
  os: OSPlatform;
  userAgent: string;
  appVersion: string;
  timezone: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export const deviceInfoAtom = atom<DeviceInfo | null>(null);
