import { useEffect, useState } from "react";
import {
  createTicketComment,
  getTicket,
  getTicketComments,
} from "../api";

function TicketDetails({ ticketId, onBack }) {
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const initializeTicket = async () => {
      try {
        const [ticketData, commentData] =
          await Promise.all([
            getTicket(ticketId),
            getTicketComments(ticketId),
          ]);

        if (cancelled) {
          return;
        }

        setTicket(ticketData);
        setComments(commentData.items || []);
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.detail ||
              "Unable to load this ticket."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initializeTicket();

    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = comment.trim();

    if (!message) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const newComment = await createTicketComment(
        ticketId,
        message
      );

      setComments((currentComments) => [
        ...currentComments,
        newComment,
      ]);

      setComment("");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to send your reply."
      );
    } finally {
      setSending(false);
    }
  };

  const getStatusLabel = (status) => {
    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  if (loading) {
    return (
      <div className="ticket-details-loading">
        Loading ticket...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="ticket-details-page">
        <div className="ticket-details-error">
          <p>{error || "Ticket not found."}</p>

          <button
            type="button"
            onClick={onBack}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-details-page">
      <header className="ticket-details-header">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>
      </header>

      <main className="ticket-details-content">
        <section className="ticket-summary-card">
          <div className="ticket-summary-top">
            <div>
              <span className="ticket-details-number">
                {ticket.ticket_number}
              </span>

              <h1>{ticket.subject}</h1>
            </div>

            <span
              className={`status-badge status-${ticket.status}`}
            >
              {getStatusLabel(ticket.status)}
            </span>
          </div>

          <div className="ticket-description">
            <h3>Issue Description</h3>

            <p>{ticket.description}</p>
          </div>

          <div className="ticket-details-meta">
            <div>
              <span>Created</span>

              <strong>
                {new Date(
                  ticket.created_at
                ).toLocaleString()}
              </strong>
            </div>

            <div>
              <span>Last Updated</span>

              <strong>
                {new Date(
                  ticket.updated_at
                ).toLocaleString()}
              </strong>
            </div>
          </div>
        </section>

        <section className="conversation-card">
          <div className="conversation-header">
            <div>
              <h2>Conversation</h2>

              <p>
                Messages between you and the support team.
              </p>
            </div>

            <span>
              {comments.length}{" "}
              {comments.length === 1
                ? "message"
                : "messages"}
            </span>
          </div>

          {error && (
            <div className="dashboard-message error">
              {error}
            </div>
          )}

          <div className="conversation-list">
            {comments.length === 0 ? (
              <div className="conversation-empty">
                <div className="empty-icon">💬</div>

                <h3>No messages yet</h3>

                <p>
                  Send a message to start the conversation
                  with our support team.
                </p>
              </div>
            ) : (
              comments.map((item) => (
                <article
                  className="conversation-message"
                  key={item.id}
                >
                  <div className="message-avatar">
                    U
                  </div>

                  <div className="message-content">
                    <div className="message-meta">
                      <strong>
                        Support Conversation
                      </strong>

                      <span>
                        {new Date(
                          item.created_at
                        ).toLocaleString()}
                      </span>
                    </div>

                    <p>{item.body}</p>
                  </div>
                </article>
              ))
            )}
          </div>

          {ticket.status !== "closed" && (
            <form
              className="reply-form"
              onSubmit={handleSubmit}
            >
              <label htmlFor="comment">
                Add a reply
              </label>

              <textarea
                id="comment"
                value={comment}
                onChange={(event) =>
                  setComment(event.target.value)
                }
                placeholder="Write your message..."
                maxLength={5000}
                rows={4}
                required
              />

              <div className="reply-form-footer">
                <span>
                  {comment.length}/5000
                </span>

                <button
                  type="submit"
                  disabled={
                    sending || !comment.trim()
                  }
                >
                  {sending
                    ? "Sending..."
                    : "Send Reply"}
                </button>
              </div>
            </form>
          )}

          {ticket.status === "closed" && (
            <div className="closed-ticket-message">
              This ticket is closed and no longer accepts
              new messages.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default TicketDetails;