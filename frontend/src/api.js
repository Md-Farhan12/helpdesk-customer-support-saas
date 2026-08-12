import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const getCategories = async () => {
  const response = await api.get("/catalog/categories");
  return response.data;
};

export const getPriorities = async () => {
  const response = await api.get("/catalog/priorities");
  return response.data;
};

export const createTicket = async (ticketData) => {
  const response = await api.post("/tickets", ticketData);
  return response.data;
};

export const getMyTickets = async () => {
  const response = await api.get("/tickets/my");
  return response.data;
};

export const getTicket = async (ticketId) => {
  const response = await api.get(`/tickets/${ticketId}`);
  return response.data;
};

export const updateTicket = async (ticketId, ticketData) => {
  const response = await api.patch(
    `/tickets/${ticketId}`,
    ticketData
  );

  return response.data;
};

export const getTicketComments = async (ticketId) => {
  const response = await api.get(
    `/tickets/${ticketId}/comments`
  );

  return response.data;
};

export const createTicketComment = async (
  ticketId,
  body
) => {
  const response = await api.post(
    `/tickets/${ticketId}/comments`,
    {
      body,
    }
  );

  return response.data;
};

export default api;