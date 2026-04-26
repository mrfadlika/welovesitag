/**
 * SITAG Backend API Service
 * Centralized API client for all backend calls
 */

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_URL;

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (typeof window === 'undefined') {
    return '/api';
  }

  const { protocol, hostname, port } = window.location;

  // Vite dev uses a proxy for `/api`, and the backend can also serve the built app
  // directly from port 3000. Other local ports like Apache/XAMPP should talk to the
  // backend explicitly.
  if (port === '5173' || port === '3000') {
    return '/api';
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:3000/api`;
  }

  return '/api';
}

const API_BASE_URL = resolveApiBaseUrl();

// ============ AUTH ENDPOINTS ============
export const authAPI = {
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
  },
};

// ============ TRUCK ENDPOINTS ============
export const truckAPI = {
  // Get all trucks
  getAll: async (status = null) => {
    const query = status ? `?status=${status}` : '';
    const response = await fetch(`${API_BASE_URL}/trucks${query}`);
    return handleResponse(response);
  },

  // Get single truck
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/trucks/${id}`);
    return handleResponse(response);
  },

  // Create/register new truck (Staff POS)
  create: async (truckData) => {
    const response = await fetch(`${API_BASE_URL}/trucks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(truckData),
    });
    return handleResponse(response);
  },

  // Update truck status
  updateStatus: async (id, status, updatedBy) => {
    const response = await fetch(`${API_BASE_URL}/trucks/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, updatedBy }),
    });
    return handleResponse(response);
  },
};

// ============ CHECKOUT ENDPOINTS ============
export const checkoutAPI = {
  // Get all checkouts
  getAll: async (status = null, truckId = null) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (truckId) params.append('truckId', truckId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/checkouts${query}`);
    return handleResponse(response);
  },

  // Get single checkout
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/checkouts/${id}`);
    return handleResponse(response);
  },

  // Get checkouts for specific truck
  getByTruckId: async (truckId) => {
    const response = await fetch(`${API_BASE_URL}/checkouts/truck/${truckId}`);
    return handleResponse(response);
  },

  // Create checkout (Checker input)
  create: async (checkoutData) => {
    const response = await fetch(`${API_BASE_URL}/checkouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutData),
    });
    return handleResponse(response);
  },

  // Verify checkout (Staff POS approval)
  verify: async (id, verifiedBy, approved) => {
    const response = await fetch(`${API_BASE_URL}/checkouts/${id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verifiedBy, approved }),
    });
    return handleResponse(response);
  },

  // Get rekap retase summary
  getRekap: async (filters = {}) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value);
      }
    });

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/checkouts/rekap${query}`);
    return handleResponse(response);
  },
};

// ============ USER ENDPOINTS (Admin only) ============
export const userAPI = {
  // Get all users
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/users`);
    return handleResponse(response);
  },

  // Create new user
  create: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // Delete user
  remove: async (id) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// ============ SETTINGS ENDPOINTS ============ 
export const settingsAPI = {
  getRates: async () => {
    const response = await fetch(`${API_BASE_URL}/settings/rates`);
    return handleResponse(response);
  },
};

// ============ RESPONSE HANDLER ============
async function handleResponse(response) {
  try {
    const contentType = response.headers.get('content-type') || '';
    const rawBody = await response.text();
    const data = contentType.includes('application/json') && rawBody
      ? JSON.parse(rawBody)
      : null;

    if (!response.ok) {
      const fallbackMessage = rawBody && !data
        ? rawBody.slice(0, 200)
        : `Error ${response.status}`;

      return {
        success: false,
        message: data?.message || fallbackMessage,
        error: data?.error,
        status: response.status,
      };
    }

    return {
      success: true,
      data: data?.data,
      message: data?.message,
      count: data?.count,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Network error or invalid response',
      error: error.message,
      status: response.status,
    };
  }
}

export default {
  authAPI,
  truckAPI,
  checkoutAPI,
  userAPI,
  settingsAPI,
};
