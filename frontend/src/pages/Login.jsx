// frontend/src/pages/Login.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { login } from "../api/auth"

function Login() {
  const [nickname, setNickname] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()


  useEffect(() => {
    const token = localStorage.getItem("access_token")
    const role = localStorage.getItem("role")
    if (token && role) {
      navigate(role === "organizer" ? "/organizer" : "/student")
    }
  }, [navigate])

  const handleLogin = async () => {
    try {
      const data = await login(nickname, password)

      if (!data.access_token) {
        alert("Неверный логин или пароль")
        return
      }

      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("refresh_token", data.refresh_token)
      localStorage.setItem("user_id", data.user_id); 


      const meResponse = await fetch("http://127.0.0.1:8000/users/me", {
        headers: {
          Authorization: `Bearer ${data.access_token}`
        }
      })

      if (!meResponse.ok) throw new Error("Ошибка получения данных пользователя")
      
      const user = await meResponse.json()
      localStorage.setItem("role", user.role)  


      if (user.role === "organizer") {
        navigate("/organizer")
      } else {
        navigate("/student")
      }
    } catch (error) {
      console.error(error)
      alert("Ошибка входа. Проверьте консоль.")
    }
  }

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      display: "flex", justifyContent: "center", alignItems: "center",
      background: "#f9fafb" 
    }}>
      <div style={{
        background: "#ffffff", padding: "40px", borderRadius: "20px",
        boxShadow: "0 10px 30px rgba(79, 78, 104, 0.15)", width: "350px",
        display: "flex", flexDirection: "column", gap: "15px"
      }}>
        <h2 style={{ textAlign: "center", color: "#4f5260", marginBottom: "20px" }}>Contester</h2>
        
        <input
          placeholder="Имя пользователя" value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          style={{ padding: "12px", borderRadius: "10px", border: "1px solid #d1d5db", outline: "none" }}
        />
        <input
          type="password" placeholder="Пароль" value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "12px", borderRadius: "10px", border: "1px solid #b6b7b9", outline: "none" }}
        />
        <button
          onClick={handleLogin}
          style={{
            marginTop: "10px", padding: "12px", borderRadius: "12px", border: "none",
            background: "#4f5260", color: "white", cursor: "pointer", fontWeight: "600"
          }}
        >
          Войти
        </button>
      </div>
    </div>
  )
}

export default Login