import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function CurrentUser() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    base44.auth.me()
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