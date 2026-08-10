import { useEffect, useState } from "react";
import { checkHealth } from "./api";

function App() {
  const [status, setStatus] = useState("Checking backend...");
  const [error, setError] = useState("");

  useEffect(() => {
    checkHealth()
      .then((data) => {
        setStatus(data.message);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not connect to the backend.");
      });
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Helpdesk Customer Support SaaS</h1>

      <h2>Backend Connection Test</h2>

      {error ? (
        <p>{error}</p>
      ) : (
        <p>{status}</p>
      )}
    </div>
  );
}

export default App;