import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./AgentDashboard.css";

const STATUS_OPTIONS = [
  "open",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
];

function AgentDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedTicket, setSelectedTicket] =
    useState(null);

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] =
    useState(false);

  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] =
    useState(false);

  // Load all tickets when dashboard opens
  useEffect(() => {
    let cancelled = false;

    const fetchTickets = async () => {
      try {
        const response = await api.get("/tickets/all");

        if (!cancelled) {
          setTickets(response.data.items || []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.detail ||
              "Unable to load support tickets."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTickets();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadTickets = async () => {
    try {
      setError("");

      const response = await api.get("/tickets/all");

      setTickets(response.data.items || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load support tickets."
      );
    }
  };

  const statistics = useMemo(() => {
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

  const updateStatus = async (
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
      setUpdatingId(ticket.id);
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

      setSelectedTicket((currentTicket) =>
        currentTicket?.id === ticket.id
          ? response.data
          : currentTicket
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
      setUpdatingId(null);
    }
  };

  // Open ticket conversation
  const openConversation = async (ticket) => {
    try {
      setSelectedTicket(ticket);
      setComments([]);
      setReply("");
      setCommentsLoading(true);
      setError("");
      setSuccess("");

      const response = await api.get(
        `/tickets/${ticket.id}/comments`
      );

      setComments(response.data.items || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load ticket conversation."
      );
    } finally {
      setCommentsLoading(false);
    }
  };

  // Close conversation panel
  const closeConversation = () => {
    setSelectedTicket(null);
    setComments([]);
    setReply("");
    setError("");
    setSuccess("");
  };

  // Send agent reply
  const handleReply = async (event) => {
    event.preventDefault();

    const message = reply.trim();

    if (!message || !selectedTicket) {
      return;
    }

    try {
      setSendingReply(true);
      setError("");
      setSuccess("");

      const response = await api.post(
        `/tickets/${selectedTicket.id}/comments`,
        {
          body: message,
        }
      );

      setComments((currentComments) => [
        ...currentComments,
        response.data,
      ]);

      setReply("");

      setSuccess(
        `Reply sent to ${selectedTicket.ticket_number}.`
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to send your reply."
      );
    } finally {
      setSendingReply(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="agent-loading">
        Loading agent dashboard...
      </div>
    );
  }

  return (
    <div className="agent-page">
      <header className="agent-header">
        <div className="agent-brand">
          <div className="agent-logo">H</div>

          <div>
            <h1>Helpdesk SaaS</h1>
            <p>Support Agent Portal</p>
          </div>
        </div>

        <button
          type="button"
          className="agent-logout"
          onClick={handleLogout}
        >
          Sign Out
        </button>
      </header>

      <main className="agent-content">
        <section className="agent-welcome">
          <div>
            <span className="agent-eyebrow">
              SUPPORT OPERATIONS
            </span>

            <h2>Ticket Management</h2>

            <p>
              Review customer requests, communicate with
              customers, and manage support workflows.
            </p>
          </div>
        </section>

        {error && (
          <div className="agent-message agent-error">
            {error}
          </div>
        )}

        {success && (
          <div className="agent-message agent-success">
            {success}
          </div>
        )}

        <section className="agent-stats">
          <div className="agent-stat-card">
            <span>Total</span>
            <strong>{statistics.total}</strong>
          </div>

          <div className="agent-stat-card">
            <span>Open</span>
            <strong>{statistics.open}</strong>
          </div>

          <div className="agent-stat-card">
            <span>Assigned</span>
            <strong>{statistics.assigned}</strong>
          </div>

          <div className="agent-stat-card">
            <span>In Progress</span>
            <strong>{statistics.inProgress}</strong>
          </div>

          <div className="agent-stat-card">
            <span>Resolved</span>
            <strong>{statistics.resolved}</strong>
          </div>

          <div className="agent-stat-card">
            <span>Closed</span>
            <strong>{statistics.closed}</strong>
          </div>
        </section>

        <section className="agent-card">
          <div className="agent-card-header">
            <div>
              <h3>All Support Tickets</h3>

              <p>
                Manage customer requests and communicate
                with customers.
              </p>
            </div>

            <button
              type="button"
              className="refresh-button"
              onClick={loadTickets}
            >
              Refresh
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className="agent-empty">
              <div className="agent-empty-icon">
                ✓
              </div>

              <h4>No tickets available</h4>

              <p>
                Customer support tickets will appear here.
              </p>
            </div>
          ) : (
            <div className="agent-table-wrapper">
              <table className="agent-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Subject</th>
                    <th>Customer</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
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
                        <div className="ticket-subject">
                          {ticket.subject}
                        </div>

                        <div className="ticket-description">
                          {ticket.description.length > 80
                            ? `${ticket.description.slice(
                                0,
                                80
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
                        <select
                          value={ticket.status}
                          disabled={
                            updatingId === ticket.id ||
                            ticket.status === "closed"
                          }
                          onChange={(event) =>
                            updateStatus(
                              ticket,
                              event.target.value
                            )
                          }
                          className={`agent-status-select status-${ticket.status}`}
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
                                {getStatusLabel(status)}
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

                      <td>
                        <button
                          type="button"
                          className="view-ticket-button"
                          onClick={() =>
                            openConversation(ticket)
                          }
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedTicket && (
          <section className="agent-conversation-card">
            <div className="conversation-card-header">
              <div>
                <span className="conversation-ticket-number">
                  {selectedTicket.ticket_number}
                </span>

                <h3>{selectedTicket.subject}</h3>

                <p>
                  Customer conversation and support
                  responses.
                </p>
              </div>

              <button
                type="button"
                className="close-conversation-button"
                onClick={closeConversation}
              >
                Close
              </button>
            </div>

            <div className="agent-ticket-info">
              <div>
                <span>Status</span>

                <strong>
                  {getStatusLabel(
                    selectedTicket.status
                  )}
                </strong>
              </div>

              <div>
                <span>Customer</span>

                <strong>
                  #{selectedTicket.customer_id}
                </strong>
              </div>

              <div>
                <span>Priority</span>

                <strong>
                  #{selectedTicket.priority_id}
                </strong>
              </div>
            </div>

            <div className="agent-conversation-list">
              {commentsLoading ? (
                <div className="conversation-loading">
                  Loading conversation...
                </div>
              ) : comments.length === 0 ? (
                <div className="conversation-empty">
                  <div className="agent-empty-icon">
                    💬
                  </div>

                  <h4>No messages yet</h4>

                  <p>
                    The customer has not added any
                    messages to this ticket.
                  </p>
                </div>
              ) : (
                comments.map((comment) => (
                  <article
                    className="agent-comment"
                    key={comment.id}
                  >
                    <div className="comment-avatar">
                      U
                    </div>

                    <div className="comment-body">
                      <div className="comment-meta">
                        <strong>
                          Support Conversation
                        </strong>

                        <span>
                          {new Date(
                            comment.created_at
                          ).toLocaleString()}
                        </span>
                      </div>

                      <p>{comment.body}</p>
                    </div>
                  </article>
                ))
              )}
            </div>

            {selectedTicket.status !== "closed" && (
              <form
                className="agent-reply-form"
                onSubmit={handleReply}
              >
                <label htmlFor="agent-reply">
                  Reply to Customer
                </label>

                <textarea
                  id="agent-reply"
                  value={reply}
                  onChange={(event) =>
                    setReply(event.target.value)
                  }
                  placeholder="Write a response to the customer..."
                  rows={4}
                  maxLength={5000}
                  required
                />

                <div className="agent-reply-footer">
                  <span>
                    {reply.length}/5000
                  </span>

                  <button
                    type="submit"
                    disabled={
                      sendingReply ||
                      !reply.trim()
                    }
                  >
                    {sendingReply
                      ? "Sending..."
                      : "Send Reply"}
                  </button>
                </div>
              </form>
            )}

            {selectedTicket.status === "closed" && (
              <div className="closed-conversation">
                This ticket is closed and no longer
                accepts replies.
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default AgentDashboard;