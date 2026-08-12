import { useEffect, useState } from "react";
import {
  createTicket,
  getCategories,
  getMyTickets,
  getPriorities,
} from "../api";
import TicketDetails from "./TicketDetails";

function Dashboard() {
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [selectedTicketId, setSelectedTicketId] =
    useState(null);

  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    category_id: "",
    priority_id: "",
  });

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [categoryData, priorityData, ticketData] =
        await Promise.all([
          getCategories(),
          getPriorities(),
          getMyTickets(),
        ]);

      setCategories(categoryData);
      setPriorities(priorityData);
      setTickets(ticketData.items || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load your support dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initializeDashboard = async () => {
      try {
        const [categoryData, priorityData, ticketData] =
          await Promise.all([
            getCategories(),
            getPriorities(),
            getMyTickets(),
          ]);

        if (cancelled) {
          return;
        }

        setCategories(categoryData);
        setPriorities(priorityData);
        setTickets(ticketData.items || []);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err.response?.data?.detail ||
            "Unable to load your support dashboard."
        );
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

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setCreating(true);

    try {
      const createdTicket = await createTicket({
        subject: formData.subject,
        description: formData.description,
        category_id: Number(formData.category_id),
        priority_id: Number(formData.priority_id),
      });

      setSuccess(
        `Ticket ${createdTicket.ticket_number} created successfully.`
      );

      setFormData({
        subject: "",
        description: "",
        category_id: "",
        priority_id: "",
      });

      await loadDashboard();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to create the support ticket."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/";
  };

  const getStatusLabel = (status) => {
    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  if (selectedTicketId) {
    return (
      <TicketDetails
        ticketId={selectedTicketId}
        onBack={() => setSelectedTicketId(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading your support dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="dashboard-logo">H</div>

          <div>
            <h1>Helpdesk SaaS</h1>
            <p>Customer Support Portal</p>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Sign Out
        </button>
      </header>

      <main className="dashboard-content">
        <section className="dashboard-welcome">
          <div>
            <p className="dashboard-eyebrow">
              CUSTOMER PORTAL
            </p>

            <h2>How can we help you?</h2>

            <p>
              Create a support request or track the progress
              of your existing tickets.
            </p>
          </div>

          <div className="ticket-count">
            <span>{tickets.length}</span>
            <small>Total Tickets</small>
          </div>
        </section>

        {error && (
          <div className="dashboard-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="dashboard-message success">
            {success}
          </div>
        )}

        <div className="dashboard-grid">
          <section className="dashboard-card create-ticket-card">
            <div className="card-header">
              <div>
                <h3>Create Support Ticket</h3>

                <p>
                  Tell our support team what you need help with.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="dashboard-form-group">
                <label htmlFor="subject">
                  Subject
                </label>

                <input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="Briefly describe your issue"
                  value={formData.subject}
                  onChange={handleChange}
                  minLength={5}
                  maxLength={200}
                  required
                />
              </div>

              <div className="dashboard-form-row">
                <div className="dashboard-form-group">
                  <label htmlFor="category_id">
                    Category
                  </label>

                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="dashboard-form-group">
                  <label htmlFor="priority_id">
                    Priority
                  </label>

                  <select
                    id="priority_id"
                    name="priority_id"
                    value={formData.priority_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select priority
                    </option>

                    {priorities.map((priority) => (
                      <option
                        key={priority.id}
                        value={priority.id}
                      >
                        {priority.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="dashboard-form-group">
                <label htmlFor="description">
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  placeholder="Describe your issue in detail..."
                  value={formData.description}
                  onChange={handleChange}
                  minLength={10}
                  rows={6}
                  required
                />
              </div>

              <button
                type="submit"
                className="create-ticket-button"
                disabled={creating}
              >
                {creating
                  ? "Creating Ticket..."
                  : "Create Support Ticket"}
              </button>
            </form>
          </section>

          <section className="dashboard-card tickets-card">
            <div className="card-header">
              <div>
                <h3>My Tickets</h3>

                <p>
                  Track your support requests and their status.
                </p>
              </div>
            </div>

            {tickets.length === 0 ? (
              <div className="empty-tickets">
                <div className="empty-icon">✓</div>

                <h4>No tickets yet</h4>

                <p>
                  Your submitted support requests will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="ticket-list">
                {tickets.map((ticket) => (
                  <article
                    className="ticket-item ticket-item-clickable"
                    key={ticket.id}
                    onClick={() =>
                      setSelectedTicketId(ticket.id)
                    }
                  >
                    <div className="ticket-item-top">
                      <span className="ticket-number">
                        {ticket.ticket_number}
                      </span>

                      <span
                        className={`status-badge status-${ticket.status}`}
                      >
                        {getStatusLabel(ticket.status)}
                      </span>
                    </div>

                    <h4>{ticket.subject}</h4>

                    <p>
                      {ticket.description.length > 100
                        ? `${ticket.description.slice(
                            0,
                            100
                          )}...`
                        : ticket.description}
                    </p>

                    <div className="ticket-meta">
                      <span>
                        Created{" "}
                        {new Date(
                          ticket.created_at
                        ).toLocaleDateString()}
                      </span>

                      <span>
                        Updated{" "}
                        {new Date(
                          ticket.updated_at
                        ).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="ticket-open-hint">
                      View conversation →
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;