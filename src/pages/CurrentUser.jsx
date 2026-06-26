import { useEffect, useState } from "react";
import { authService } from "@/services/authService";

export default function CurrentUser() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    authService
      .me()
      .then(setUser)
      .catch((err) => {
        console.error(err);
        setError(err?.message || "Error");
      });
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Current User Debug</h1>

      {error && <p>Error: {error}</p>}

      <pre>
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  );
}
