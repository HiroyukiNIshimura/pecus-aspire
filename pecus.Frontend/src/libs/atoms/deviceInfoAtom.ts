import { atom } from "jotai";
import type { DeviceType } from "@/connectors/api/pecus/models/DeviceType";
import type { OSPlatform } from "@/connectors/api/pecus/models/OSPlatform";

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
