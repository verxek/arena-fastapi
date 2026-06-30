import { useState, useCallback } from "react"; 
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
  
  const handleLoginClose = useCallback(() => {
    setShowLogin(false);
  }, []);

  const handleRegisterClose = useCallback(() => {
    setShowRegister(false);
  }, []);

  return (
    <>  
      {/* НАВБАР */}
      <div className="navbar">

        {/* LOGO */}
        <div className="navbar-logo">
          <GrCodeSandbox size={22} />
          code arena
        </div>

        <div className="navbar-menu">
          {role === "admin" ? (
            <Link to="/admin" className="navbar-link navbar-link--admin">
              Админ панель
            </Link>
          ) : (
            <>
              <Link to="/dashboard" className="navbar-link">
                Главная
              </Link>
              <Link to="/contests" className="navbar-link">
                Контесты
              </Link>
              <Link to="/tasks" className="navbar-link">
                Задачи
              </Link>
              <Link to="/archive" className="navbar-link">
                Архив
              </Link>
            </>
          )}
        </div>

        <div className="navbar-actions">
          {token ? (
            <>
              {role !== "admin" && (
                <button
                  onClick={() => navigate("/profile")}
                  className="profile-btn"
                >
                  <FaUser />
                </button>
              )}

              <button onClick={logout} className="logout-btn">
                Выйти
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="btn btn-primary"
            >
              Войти
            </button>
          )}
        </div>
      </div>

      {/* MODALS */}
      <LoginModal 
        isOpen={showLogin} 
        onClose={handleLoginClose}
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