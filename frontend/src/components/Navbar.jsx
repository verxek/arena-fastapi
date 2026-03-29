import { Link, useNavigate } from "react-router-dom"

function Navbar() {

  const navigate = useNavigate()

  const role = localStorage.getItem("role")
  const token = localStorage.getItem("access_token")

  const homePath = role === "organizer" ? "/organizer" : "/student"

  const logout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("role")
    localStorage.removeItem("user_id")
    navigate("/")
  }

  return (

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
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        fontSize: "20px",      
        fontWeight: "700",   
        color: "#1f2739",     
        gap: "10px",
        fontWeight: "bold",
        
      }}>
        <div style={{
          width: "15px",
          height: "15px",
          borderRadius: "50%",
          border: "5px solid #1f2739"
        }}></div>

        Code Arena
      </div>


      {/* LINKS */}
      <div style={{
        display: "flex",
        gap: "25px",
        alignItems: "center"
      }}>

        <Link to={homePath} style={{textDecoration:"none", color:"#1f2739"}}>
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

      </div>


      {/* RIGHT SIDE */}
      <div style={{
        display: "flex",
        gap: "15px",
        alignItems: "center"
      }}>

        {token ? (
          <>
          
          <button
              onClick={() => navigate("/profile")}
              title="Профиль" 
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
                fontSize: "18px",
                color: "#1f2739",
                transition: "all 0.2s",
                padding: 0 
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#e5e7eb";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "#f3f4f6";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              👤
            </button>
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
                color: "#1f2739",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => e.target.style.background = "#e5e7eb"}
              onMouseOut={(e) => e.target.style.background = "#f3f4f6"}
            >
              Выйти
            </button>
        </>
        ) : (
          // ЕСЛИ НЕ АВТОРИЗОВАН
          <button
            onClick={() => navigate("/login")}
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
  )
}

export default Navbar