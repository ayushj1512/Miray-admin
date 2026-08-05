import { num } from "@/app/production/all-production-job/utils";

export default function QuantityCard({
  label,
  value,
  emphasis = false,
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4",
        emphasis
          ? "border-black bg-black text-white"
          : "border-zinc-200 bg-zinc-50",
      ].join(" ")}
    >
      <p
        className={[
          "text-[10px] font-semibold uppercase tracking-[0.16em]",
          emphasis
            ? "text-zinc-300"
            : "text-zinc-500",
        ].join(" ")}
      >
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {num(value)}
      </p>
    </div>
  );
}