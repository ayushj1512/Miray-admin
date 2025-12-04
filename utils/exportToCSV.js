export function exportOrdersToCSV(orders) {
  if (!orders || orders.length === 0) return;

  // CSV HEADERS
  const headers = [
    "Order Number",
    "Customer Name",
    "Phone",
    "Payment Method",
    "Payment Status",
    "Fulfillment Status",
    "Amount",
    "Date"
  ];

  const rows = orders.map((o) => [
    o.orderNumber,
    o.customerId?.name || "Unknown",
    o.customerId?.phone || "",
    o.paymentMethod,
    o.paymentStatus,
    o.fulfillmentStatus,
    o.finalPayable,
    new Date(o.createdAt).toLocaleString()
  ]);

  let csvContent =
    headers.join(",") +
    "\n" +
    rows.map((r) => r.join(",")).join("\n");

  // DOWNLOAD CSV
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `orders_export_${Date.now()}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}
