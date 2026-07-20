import logo from "@/assets/logo.png";

export function Logo({ size = 32, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src={logo} alt="CorridorX logo" width={size} height={size} style={{ width: size, height: size }} />
      {showText && (
        <span
          className="font-semibold tracking-tight text-foreground"
          style={{ fontFamily: "var(--font-display)", fontSize: size * 0.6 }}
        >
          CorridorX
        </span>
      )}
    </div>
  );
}
