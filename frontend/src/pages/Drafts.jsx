// frontend/src/pages/Drafts.jsx
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Drafts() {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", paddingBottom: "40px" }}>
      <Navbar />
      
      <div style={{
        position: "absolute",
        top: "100px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "90%",
        maxWidth: "1200px",
        boxSizing: "border-box"
      }}>
        
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#111827", marginBottom: "24px" }}>
          Черновики контестов
        </h1>

        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>
            Здесь будет список ваших черновиков.
          </p>
          <button
            onClick={() => navigate("/contests/create")}
            style={{
              background: "#1f2739",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Создать новый черновик
          </button>
        </div>
      </div>
    </div>
  );
}

export default Drafts;