// src/components/SplashScreen.tsx
import LogoMark from "@/components/LogoMark";

type Props = {
  visible: boolean;
};

export default function SplashScreen({ visible }: Props) {
  if (!visible) return null;

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-white
        transition-opacity duration-500
      "
    >
      <div className="flex flex-col items-center gap-3">
        <LogoMark size={56} className="splash-logo" />
        <span className="text-lg font-semibold tracking-tight">
          SmartSpend
        </span>
      </div>
    </div>
  );
}
