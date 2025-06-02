
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new auth page
    navigate("/auth", { replace: true });
  }, [navigate]);

  return null;
};

export default Login;
