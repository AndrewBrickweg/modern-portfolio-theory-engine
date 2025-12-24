import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "../components/Button";

const Logout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/logout", { method: "GET" });
    } catch {
      // ignore errors; still navigate away
    } finally {
      setLoading(false);
      navigate("/");
    }
  };

  return (
    <div>
      <Button onClick={handleLogout} type="button" fullWidth={false}>
        {loading ? "Logging out..." : "Logout"}
      </Button>
    </div>
  );
};

export default Logout;
