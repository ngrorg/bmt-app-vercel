// Redirect to login - main app entry is handled by App.tsx routing
import { Navigate } from "react-router-dom";

const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
