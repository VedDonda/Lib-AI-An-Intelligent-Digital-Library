const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const buildHeaders = () => ({
  "Content-Type": "application/json",
});

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
};

export const registerRequest = async ({ name, email, password, role }) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/register`, {
    method: "POST",
    headers: buildHeaders(),
    credentials: "include",
    body: JSON.stringify({ name, email, password, role }),
  });

  return handleResponse(response);
};

export const verifyOtpRequest = async ({ email, otp }) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/verify-otp`, {
    method: "POST",
    headers: buildHeaders(),
    credentials: "include",
    body: JSON.stringify({ email, otp }),
  });

  return handleResponse(response);
};

export const resendOtpRequest = async ({ email }) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/resend-otp`, {
    method: "POST",
    headers: buildHeaders(),
    credentials: "include",
    body: JSON.stringify({ email }),
  });

  return handleResponse(response);
};

export const loginRequest = async ({ email, password }) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/login`, {
    method: "POST",
    headers: buildHeaders(),
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  return handleResponse(response);
};

export const forgotPasswordRequest = async ({ email }) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/forgot-password`, {
    method: "POST",
    headers: buildHeaders(),
    credentials: "include",
    body: JSON.stringify({ email }),
  });
  return handleResponse(response);
};

export const verifyForgotPasswordOtpRequest = async ({ email, otp }) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/forgot-password/verify-otp`, {
    method: "POST",
    headers: buildHeaders(),
    credentials: "include",
    body: JSON.stringify({ email, otp }),
  });
  return handleResponse(response);
};

export const resetPasswordRequest = async ({ email, resetToken, newPassword }) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/forgot-password/reset`, {
    method: "POST",
    headers: buildHeaders(),
    credentials: "include",
    body: JSON.stringify({ email, resetToken, newPassword }),
  });
  return handleResponse(response);
};
