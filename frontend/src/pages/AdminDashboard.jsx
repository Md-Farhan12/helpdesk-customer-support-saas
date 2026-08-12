import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./AdminDashboard.css";

const STATUS_OPTIONS = [
  "open",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
];

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [updatingTicketId, setUpdatingTicketId] = useState(null);
  const [assigningTicketId, setAssigningTicketId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    const initializeDashboard = async () => {
      try {
        const [usersResponse, ticketsResponse] =
          await Promise.all([
            api.get("/admin/users"),
            api.get("/tickets/all"),
          ]);

        if (!cancelled) {
          setUsers(usersResponse.data.data || []);
          setTickets(ticketsResponse.data.items || []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.detail ||
              "Unable to load administrator dashboard."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initializeDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadDashboard = async () => {
    try {
      setError("");
      setSuccess("");

      const [usersResponse, ticketsResponse] =
        await Promise.all([
          api.get("/admin/users"),
          api.get("/tickets/all"),
        ]);

      setUsers(usersResponse.data.data || []);
      setTickets(ticketsResponse.data.items || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to refresh dashboard."
      );
    }
  };

  const agents = useMemo(() => {
    return users.filter(
      (user) =>
        user.role === "agent" &&
        user.is_active
    );
  }, [users]);

  const userStatistics = useMemo(() => {
    return {
      total: users.length,

      customers: users.filter(
        (user) => user.role === "customer"
      ).length,

      agents: users.filter(
        (user) => user.role === "agent"
      ).length,

      administrators: users.filter(
        (user) =>
          user.role === "admin" ||
          user.role === "administrator"
      ).length,
    };
  }, [users]);

  const ticketStatistics = useMemo(() => {
    return {
      total: tickets.length,

      open: tickets.filter(
        (ticket) => ticket.status === "open"
      ).length,

      assigned: tickets.filter(
        (ticket) => ticket.status === "assigned"
      ).length,

      inProgress: tickets.filter(
        (ticket) => ticket.status === "in_progress"
      ).length,

      resolved: tickets.filter(
        (ticket) => ticket.status === "resolved"
      ).length,

      closed: tickets.filter(
        (ticket) => ticket.status === "closed"
      ).length,
    };
  }, [tickets]);

  const getStatusLabel = (status) => {
    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const canMoveToStatus = (
    currentStatus,
    newStatus
  ) => {
    const transitions = {
      open: ["assigned"],
      assigned: ["in_progress"],
      in_progress: ["resolved"],
      resolved: ["closed"],
      closed: [],
    };

    return (
      currentStatus === newStatus ||
      transitions[currentStatus]?.includes(newStatus)
    );
  };

  const updateTicketStatus = async (
    ticket,
    newStatus
  ) => {
    if (newStatus === ticket.status) {
      return;
    }

    if (
      !canMoveToStatus(
        ticket.status,
        newStatus
      )
    ) {
      setError(
        `Invalid status transition: ${getStatusLabel(
          ticket.status
        )} → ${getStatusLabel(newStatus)}`
      );
      return;
    }

    try {
      setUpdatingTicketId(ticket.id);
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/tickets/${ticket.id}`,
        {
          status: newStatus,
        }
      );

      setTickets((currentTickets) =>
        currentTickets.map((item) =>
          item.id === ticket.id
            ? response.data
            : item
        )
      );

      setSuccess(
        `${ticket.ticket_number} moved to ${getStatusLabel(
          newStatus
        )}.`
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to update ticket status."
      );
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const assignTicket = async (
    ticket,
    agentId
  ) => {
    if (!agentId) {
      return;
    }

    try {
      setAssigningTicketId(ticket.id);
      setError("");
      setSuccess("");

      const response = await api.post(
        `/tickets/${ticket.id}/assign`,
        null,
        {
          params: {
            agent_id: Number(agentId),
          },
        }
      );

      setTickets((currentTickets) =>
        currentTickets.map((item) =>
          item.id === ticket.id
            ? response.data
            : item
        )
      );

      const selectedAgent = agents.find(
        (agent) =>
          agent.id === Number(agentId)
      );

      setSuccess(
        `${ticket.ticket_number} assigned to ${
          selectedAgent?.name || "Support Agent"
        }.`
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to assign ticket."
      );
    } finally {
      setAssigningTicketId(null);
    }
  };

  const unassignTicket = async (ticket) => {
    try {
      setAssigningTicketId(ticket.id);
      setError("");
      setSuccess("");

      const response = await api.post(
        `/tickets/${ticket.id}/unassign`
      );

      setTickets((currentTickets) =>
        currentTickets.map((item) =>
          item.id === ticket.id
            ? response.data
            : item
        )
      );

      setSuccess(
        `${ticket.ticket_number} has been unassigned.`
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to unassign ticket."
      );
    } finally {
      setAssigningTicketId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    if (
      user.role === "admin" ||
      user.role === "administrator"
    ) {
      setError(
        "Administrator accounts cannot be deleted."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(user.id);
      setError("");
      setSuccess("");

      await api.delete(
        `/admin/users/${user.id}`
      );

      setUsers((currentUsers) =>
        currentUsers.filter(
          (item) => item.id !== user.id
        )
      );

      setSuccess(
        `${user.name} was deleted successfully.`
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to delete user."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleLabel = (role) => {
    if (
      role === "admin" ||
      role === "administrator"
    ) {
      return "Administrator";
    }

    if (role === "agent") {
      return "Support Agent";
    }

    return "Customer";
  };

  const getRoleClass = (role) => {
    if (
      role === "admin" ||
      role === "administrator"
    ) {
      return "admin-role";
    }

    if (role === "agent") {
      return "agent-role";
    }

    return "customer-role";
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="admin-loading">
        Loading administrator dashboard...
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-brand">
          <div className="admin-logo">H</div>

          <div>
            <h1>Helpdesk SaaS</h1>
            <p>Administrator Portal</p>
          </div>
        </div>

        <button
          type="button"
          className="admin-logout"
          onClick={handleLogout}
        >
          Sign Out
        </button>
      </header>

      <main className="admin-content">
        <section className="admin-welcome">
          <span className="admin-eyebrow">
            SYSTEM ADMINISTRATION
          </span>

          <h2>Administrator Dashboard</h2>

          <p>
            Manage users, tickets, and support
            operations from one place.
          </p>
        </section>

        {error && (
          <div className="admin-message admin-error">
            {error}
          </div>
        )}

        {success && (
          <div className="admin-message admin-success">
            {success}
          </div>
        )}

        <section className="admin-stats">
          <div className="admin-stat-card">
            <span>Total Users</span>
            <strong>
              {userStatistics.total}
            </strong>
          </div>

          <div className="admin-stat-card">
            <span>Customers</span>
            <strong>
              {userStatistics.customers}
            </strong>
          </div>

          <div className="admin-stat-card">
            <span>Support Agents</span>
            <strong>
              {userStatistics.agents}
            </strong>
          </div>

          <div className="admin-stat-card">
            <span>Administrators</span>
            <strong>
              {userStatistics.administrators}
            </strong>
          </div>
        </section>

        <section className="admin-ticket-stats">
          <div className="admin-ticket-stat">
            <span>Total Tickets</span>
            <strong>
              {ticketStatistics.total}
            </strong>
          </div>

          <div className="admin-ticket-stat">
            <span>Open</span>
            <strong>
              {ticketStatistics.open}
            </strong>
          </div>

          <div className="admin-ticket-stat">
            <span>Assigned</span>
            <strong>
              {ticketStatistics.assigned}
            </strong>
          </div>

          <div className="admin-ticket-stat">
            <span>In Progress</span>
            <strong>
              {ticketStatistics.inProgress}
            </strong>
          </div>

          <div className="admin-ticket-stat">
            <span>Resolved</span>
            <strong>
              {ticketStatistics.resolved}
            </strong>
          </div>

          <div className="admin-ticket-stat">
            <span>Closed</span>
            <strong>
              {ticketStatistics.closed}
            </strong>
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3>Ticket Management</h3>

              <p>
                Monitor requests, assign agents,
                and control ticket workflow.
              </p>
            </div>

            <button
              type="button"
              className="admin-refresh"
              onClick={loadDashboard}
            >
              Refresh
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">
                ✓
              </div>

              <h4>No tickets available</h4>

              <p>
                Customer support tickets will
                appear here.
              </p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Subject</th>
                    <th>Customer</th>
                    <th>Priority</th>
                    <th>Assigned Agent</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>

                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <strong>
                          {ticket.ticket_number}
                        </strong>
                      </td>

                      <td>
                        <div className="admin-user-name">
                          {ticket.subject}
                        </div>

                        <div className="admin-ticket-description">
                          {ticket.description.length >
                          70
                            ? `${ticket.description.slice(
                                0,
                                70
                              )}...`
                            : ticket.description}
                        </div>
                      </td>

                      <td>
                        #{ticket.customer_id}
                      </td>

                      <td>
                        #{ticket.priority_id}
                      </td>

                      <td>
                        <div className="admin-assignment">
                          <select
                            value={
                              ticket.assigned_agent_id ||
                              ""
                            }
                            disabled={
                              assigningTicketId ===
                                ticket.id ||
                              ticket.status ===
                                "closed"
                            }
                            onChange={(event) => {
                              const value =
                                event.target.value;

                              if (!value) {
                                unassignTicket(ticket);
                              } else {
                                assignTicket(
                                  ticket,
                                  value
                                );
                              }
                            }}
                            className="admin-agent-select"
                          >
                            <option value="">
                              Unassigned
                            </option>

                            {agents.map((agent) => (
                              <option
                                key={agent.id}
                                value={agent.id}
                              >
                                {agent.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      <td>
                        <select
                          value={ticket.status}
                          disabled={
                            updatingTicketId ===
                              ticket.id ||
                            ticket.status ===
                              "closed"
                          }
                          onChange={(event) =>
                            updateTicketStatus(
                              ticket,
                              event.target.value
                            )
                          }
                          className={`admin-status-select status-${ticket.status}`}
                        >
                          {STATUS_OPTIONS.map(
                            (status) => (
                              <option
                                key={status}
                                value={status}
                                disabled={
                                  !canMoveToStatus(
                                    ticket.status,
                                    status
                                  )
                                }
                              >
                                {getStatusLabel(
                                  status
                                )}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td>
                        {new Date(
                          ticket.created_at
                        ).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3>User Management</h3>

              <p>
                View and manage customer and
                support accounts.
              </p>
            </div>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>#{user.id}</strong>
                    </td>

                    <td>
                      <div className="admin-user-name">
                        {user.name}
                      </div>
                    </td>

                    <td>{user.email}</td>

                    <td>
                      <span
                        className={`admin-role-badge ${getRoleClass(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          user.is_active
                            ? "active-status"
                            : "inactive-status"
                        }
                      >
                        {user.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="admin-delete"
                        disabled={
                          deletingId === user.id ||
                          user.role === "admin" ||
                          user.role ===
                            "administrator"
                        }
                        onClick={() =>
                          handleDeleteUser(user)
                        }
                      >
                        {deletingId === user.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;