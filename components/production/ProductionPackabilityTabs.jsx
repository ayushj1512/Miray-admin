"use client";

export default function ProductionPackabilityTabs({
  value = "packable",
  onChange = () => {},
  loading = false,
}) {
  const tabs = [
    { label: "Packable", value: "packable" },
    { label: "Unpackable", value: "unpackable" },
  ];

  return (
    <div className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-200">
      {tabs.map((tab) => {
        const active = value === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            disabled={loading}
            onClick={() => onChange(tab.value)}
            className={`min-w-[110px] rounded-lg px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-black text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-50 hover:text-black"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}