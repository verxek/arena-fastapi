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
      background: "#f3f4f6",
      borderRadius: "20px",
      boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
      padding: "15px 30px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      zIndex: 1000
    }}>

      {/* LOGO */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontWeight: "bold",
        fontSize: "18px",
        color: "#111"
      }}>
        <div style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          border: "5px solid #1f2739"
        }}></div>

        Contester
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

      </div>


      {/* RIGHT SIDE */}
      <div style={{
        display: "flex",
        gap: "15px",
        alignItems: "center"
      }}>

        {token ? (
          // ЕСЛИ АВТОРИЗОВАН
          <button
            onClick={logout}
            style={{
              background: "#e5e7eb",
              border: "none",
              padding: "8px 16px",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "500",
              color: "#1f2739"
            }}
          >
            Выйти
          </button>
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