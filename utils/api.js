const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const getErrorMessage = (
  error,
  fallback = "Something went wrong"
) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

const request = async (
  method,
  endpoint,
  body = null,
  params = {}
) => {
  const query = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      query.append(key, value);
    }
  });

  const url = `${API_BASE_URL}/${endpoint}${
    query.toString() ? `?${query}` : ""
  }`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data?.message || "API request failed"
    );
  }

  return data;
};

export const getRequest = (endpoint, params = {}) =>
  request("GET", endpoint, null, params);

export const postRequest = (endpoint, body = {}) =>
  request("POST", endpoint, body);

export const putRequest = (endpoint, body = {}) =>
  request("PUT", endpoint, body);

export const patchRequest = (endpoint, body = {}) =>
  request("PATCH", endpoint, body);

export const deleteRequest = (endpoint) =>
  request("DELETE", endpoint);