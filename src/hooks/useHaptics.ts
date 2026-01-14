import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

export const useHaptics = () => {
  const isNative = Capacitor.isNativePlatform();

  const lightImpact = async () => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  };

  const mediumImpact = async () => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
  };

  const heavyImpact = async () => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  };

  const selectionChanged = async () => {
    if (isNative) {
      await Haptics.selectionChanged();
    }
  };

  const notificationSuccess = async () => {
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Success });
    }
  };

  const notificationWarning = async () => {
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Warning });
    }
  };

  const notificationError = async () => {
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Error });
    }
  };

  const vibrate = async (duration = 300) => {
    if (isNative) {
      await Haptics.vibrate({ duration });
    }
  };

  return {
    isNative,
    lightImpact,
    mediumImpact,
    heavyImpact,
    selectionChanged,
    notificationSuccess,
    notificationWarning,
    notificationError,
    vibrate,
  };
};
