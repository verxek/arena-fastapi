import { useState } from "react"; 
import { Link, useNavigate } from "react-router-dom";
import LoginModal from "./LoginModal";  
import RegisterModal from "./RegisterModal";
import { FaUser } from "react-icons/fa";
import { GrCodeSandbox } from "react-icons/gr";

function Navbar() {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false); 
  const [showRegister, setShowRegister] = useState(false); 

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("access_token");

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    navigate("/");
  };

  return (
    <>  
      {/* НАВБАР */}
      <div style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        width: "90%",
        maxWidth: "1200px",
        background: "#ffffff",
        borderRadius: "20px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
        padding: "15px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxSizing: "border-box",
        zIndex: 1000
      }}>

        {/* LOGO */}
        <div style={{
          display: "flex",
          alignItems: "center",
          fontSize: "20px",
          fontWeight: "700",
          color: "#1f2739",
          gap: "10px",
          lineHeight: 1
        }}>
          <GrCodeSandbox size={22} />
          code arena
        </div>

        {/* МЕНЮ */}
        <div style={{ display: "flex", gap: "25px", alignItems: "center" }}>

          
          {role === "admin" ? (
            <Link
              to="/admin"
              style={{ textDecoration: "none", color: "#1f2739", fontWeight: "600" }}
            >
              Админ панель
            </Link>
          ) : (
            <>
              <Link to={role === "organizer" ? "/organizer" : "/student"} style={{textDecoration:"none", color:"#1f2739"}}>
                Главная
              </Link>
              <Link to="/contests" style={{textDecoration:"none", color:"#1f2739"}}>
                Контесты
              </Link>
              <Link to="/tasks" style={{textDecoration:"none", color:"#1f2739"}}>
                Задачи
              </Link>
              <Link to="/archive" style={{textDecoration:"none", color:"#1f2739"}}>
                Архив
              </Link>
            </>
          )}

        </div>

        {/* ПРАВАЯ ЧАСТЬ */}
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>

          {token ? (
            <>
              {role !== "admin" && (
                <button
                  onClick={() => navigate("/profile")}
                  style={{
                    background: "#f3f4f6",
                    border: "none",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaUser  />
                </button>
              )}

              <button
                onClick={logout}
                style={{
                  background: "#f3f4f6",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "#1f2739"
                }}
              >
                Выйти
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              style={{
                background: "#1f2739",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              Войти
            </button>
          )}

        </div>
      </div>

      {/* MODALS */}
      <LoginModal 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />
      
      <RegisterModal 
        isOpen={showRegister} 
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    </>
  );
}

export default Navbar;