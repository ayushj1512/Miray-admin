export const SIZE_COLUMNS = ["XS", "S", "M", "L", "XL"];

export const num = (value) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

export const clean = (value) => String(value ?? "").trim();

export const getProductId = (row) =>
  row?.productId ||
  row?.product?._id ||
  row?.product ||
  row?.productModel?._id ||
  row?.productModel ||
  row?._id ||
  "";

export const normalizeSizes = (sizes = []) => {
  const map = new Map();

  for (const item of sizes || []) {
    const size = clean(item?.size).toUpperCase();

    const quantity = Math.max(
      0,
      num(item?.qty ?? item?.quantity ?? item?.count),
    );

    if (!size) continue;

    map.set(size, (map.get(size) || 0) + quantity);
  }

  return Array.from(map.entries()).map(([size, quantity]) => ({
    size,
    quantity,
  }));
};

export const mergeRowsByProductCode = (rows = []) => {
  const map = new Map();

  for (const row of rows || []) {
    const productCode =
      clean(row?.productCode) ||
      clean(row?.sku) ||
      clean(row?._id);

    if (!productCode) continue;

    if (!map.has(productCode)) {
      map.set(productCode, {
        ...row,
        productCode,
        sizes: [],
        orderNumbers: [],
        totalQty: 0,
      });
    }

    const current = map.get(productCode);

    current.totalQty += num(row?.totalQty);

    current.sizes.push(...normalizeSizes(row?.sizes));

    current.orderNumbers.push(
      ...(Array.isArray(row?.orderNumbers)
        ? row.orderNumbers
        : row?.orderNumber
          ? [row.orderNumber]
          : []),
    );

    if (!current.productTitle && row?.productTitle) {
      current.productTitle = row.productTitle;
    }

    if (!current.productImage && row?.productImage) {
      current.productImage = row.productImage;
    }

    if (!getProductId(current) && getProductId(row)) {
      current.productId = getProductId(row);
    }
  }

  return Array.from(map.values()).map((row) => {
    const sizes = normalizeSizes(row.sizes);

    return {
      ...row,
      sizes,

      totalQty:
        sizes.reduce(
          (sum, item) => sum + num(item.quantity),
          0,
        ) || num(row.totalQty),

      orderNumbers: Array.from(
        new Set(
          row.orderNumbers
            .map(clean)
            .filter(Boolean),
        ),
      ),
    };
  });
};

export const toSizeMap = (rows = []) =>
  Object.fromEntries(
    normalizeSizes(rows).map((item) => [
      item.size,
      item.quantity,
    ]),
  );

export const getCoverageForProduct = (
  coverageRows = [],
  productId,
  productCode,
) => {
  const normalizedCode = clean(productCode).toUpperCase();

  return (
    coverageRows.find((item) => {
      const sameId =
        productId &&
        String(item?.productId) === String(productId);

      const sameCode =
        normalizedCode &&
        clean(item?.productCode).toUpperCase() ===
          normalizedCode;

      return sameId || sameCode;
    }) || {
      sizes: [],
      totalQuantity: 0,
      activeJobsCount: 0,
    }
  );
};

export const subtractSizeRows = (
  demandRows = [],
  coverageRows = [],
) => {
  const demandMap = toSizeMap(demandRows);
  const coverageMap = toSizeMap(coverageRows);

  return SIZE_COLUMNS.map((size) => ({
    size,

    quantity: Math.max(
      0,
      num(demandMap[size]) -
        num(coverageMap[size]),
    ),
  })).filter((item) => item.quantity > 0);
};

export const getSizeQuantity = (
  sizes = [],
  size,
) => {
  const sizeMap = toSizeMap(sizes);

  return num(sizeMap[size]);
};

export const buildProductionRows = (
  productionJobs = [],
  productionCoverage = [],
) =>
  mergeRowsByProductCode(productionJobs).map((row) => {
    const productId = getProductId(row);

    const coverage = getCoverageForProduct(
      productionCoverage,
      productId,
      row.productCode,
    );

    const remainingSizes = subtractSizeRows(
      row.sizes,
      coverage.sizes,
    );

    const remainingQuantity =
      remainingSizes.reduce(
        (total, item) =>
          total + num(item.quantity),
        0,
      );

    return {
      ...row,

      productionCoverage: coverage,

      activeProductionQuantity: num(
        coverage.totalQuantity,
      ),

      activeJobsCount: num(
        coverage.activeJobsCount,
      ),

      remainingSizes,
      remainingQuantity,
    };
  });

export const getProductionSummary = (
  rows = [],
) =>
  rows.reduce(
    (summary, row) => {
      summary.inProduction += num(
        row.activeProductionQuantity,
      );

      summary.remaining += num(
        row.remainingQuantity,
      );

      return summary;
    },
    {
      inProduction: 0,
      remaining: 0,
    },
  );

export const buildProductionExcelRows = (
  rows = [],
) =>
  rows.map((row, index) => {
    const demandMap = toSizeMap(row?.sizes);

    const productionMap = toSizeMap(
      row?.productionCoverage?.sizes,
    );

    const remainingMap = toSizeMap(
      row?.remainingSizes,
    );

    return {
      "S.No.": index + 1,

      "Product Title":
        clean(row?.productTitle) ||
        "Untitled Product",

      "Product Code": clean(
        row?.productCode,
      ),

      "Demand XS": num(demandMap.XS),
      "Demand S": num(demandMap.S),
      "Demand M": num(demandMap.M),
      "Demand L": num(demandMap.L),
      "Demand XL": num(demandMap.XL),

      "Total Demand": num(row?.totalQty),

      "In Production XS": num(
        productionMap.XS,
      ),

      "In Production S": num(
        productionMap.S,
      ),

      "In Production M": num(
        productionMap.M,
      ),

      "In Production L": num(
        productionMap.L,
      ),

      "In Production XL": num(
        productionMap.XL,
      ),

      "Total In Production": num(
        row?.activeProductionQuantity,
      ),

      "To Produce XS": num(
        remainingMap.XS,
      ),

      "To Produce S": num(
        remainingMap.S,
      ),

      "To Produce M": num(
        remainingMap.M,
      ),

      "To Produce L": num(
        remainingMap.L,
      ),

      "To Produce XL": num(
        remainingMap.XL,
      ),

      "Total To Produce": num(
        row?.remainingQuantity,
      ),

      "Active Jobs": num(
        row?.activeJobsCount,
      ),

      "Orders Count": Array.isArray(
        row?.orderNumbers,
      )
        ? row.orderNumbers.length
        : 0,

      "Order Numbers": Array.isArray(
        row?.orderNumbers,
      )
        ? row.orderNumbers.join(", ")
        : "",
    };
  });