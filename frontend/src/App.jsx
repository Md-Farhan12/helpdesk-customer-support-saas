import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AgentDashboard from "./pages/AgentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

function App() {
  const [showSignup, setShowSignup] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("access_token"))
  );

  const [userRole, setUserRole] = useState(null);

  const [checkingUser, setCheckingUser] = useState(
    Boolean(localStorage.getItem("access_token"))
  );

  useEffect(() => {
    let cancelled = false;

    const loadCurrentUser = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        if (!cancelled) {
          setCheckingUser(false);
        }

        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          localStorage.removeItem("access_token");

          if (!cancelled) {
            setIsAuthenticated(false);
            setUserRole(null);
          }

          return;
        }

        const user = await response.json();

        if (!cancelled) {
          setIsAuthenticated(true);
          setUserRole(user.role);
        }
      } catch {
        localStorage.removeItem("access_token");

        if (!cancelled) {
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } finally {
        if (!cancelled) {
          setCheckingUser(false);
        }
      }
    };

    loadCurrentUser();

    const handleStorageChange = () => {
      const updatedToken =
        localStorage.getItem("access_token");

      if (!updatedToken) {
        setIsAuthenticated(false);
        setUserRole(null);
        setCheckingUser(false);
        return;
      }

      setCheckingUser(true);
      loadCurrentUser();
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);

  if (checkingUser) {
    return (
      <div className="dashboard-loading">
        Loading your account...
      </div>
    );
  }

  if (isAuthenticated) {
    // Administrator
    if (
      userRole === "admin" ||
      userRole === "administrator"
    ) {
      return <AdminDashboard />;
    }

    // Support Agent
    if (userRole === "agent") {
      return <AgentDashboard />;
    }

    // Customer
    return <Dashboard />;
  }

  return (
    <div className="app-container">
      <div className="brand-panel">
        <div className="brand-content">
          <div className="brand-logo">H</div>

          <h1>Helpdesk SaaS</h1>

          <p>
            Manage customer support, tickets, and service
            operations from one simple platform.
          </p>

          <div className="brand-features">
            <div>
              ✓ Centralized ticket management
            </div>

            <div>
              ✓ Faster customer support
            </div>

            <div>
              ✓ Secure role-based access
            </div>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-wrapper">
          {showSignup ? <Signup /> : <Login />}

          <div className="auth-switch">
            <span>
              {showSignup
                ? "Already have an account?"
                : "Don't have an account?"}
            </span>

            <button
              type="button"
              onClick={() =>
                setShowSignup(!showSignup)
              }
            >
              {showSignup
                ? "Sign in"
                : "Create an account"}
            </button>
          </div>

          <p className="copyright">
            © 2026 Helpdesk SaaS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;