import { isNative } from "@/shared/utils/platform";

export async function hapticSuccess() {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // Haptics not available
  }
}
