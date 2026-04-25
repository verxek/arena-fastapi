import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import "../styles/global.css";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState("participant");

  const token = localStorage.getItem("access_token");
  const currentRole = localStorage.getItem("role");

  if (currentRole !== "admin") {
    return <div>Нет доступа</div>;
  }

  const loadUsers = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // создание пользователя
  const handleCreateUser = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/admin/users", {
      method: "POST",
      headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        nickname,
        password,
        role: newRole
        })
      });
      

      if (!res.ok) {
        const err = await res.json();
        console.log(err);
        alert("Ошибка создания пользователя");
        return;
      }

      // очистка формы
      setEmail("");
      setNickname("");
      setPassword("");
      setNewRole("participant");

      loadUsers();

    } catch (err) {
      console.error(err);
    }
  };

  //  смена роли
  const changeRole = async (userId, newRole) => {
    try {
      await fetch(`http://127.0.0.1:8000/admin/users/${userId}/role?role=${newRole}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-container">
      <Navbar />

      <div className="page-layout">

  
        <h2 className="page-title">Админ панель</h2>

        {/* Форма создания */}
        <div className="block" style={{ marginTop: "20px" }}>
          <h3>Создать пользователя</h3>

          <div className="grid-2">
            <input
              className="input-field"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="input-field"
              placeholder="Никнейм"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />

            <input
              className="input-field"
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
           
            <select
                className="input-field"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                >
                <option value="participant">Participant</option>
                <option value="organizer">Organizer</option>
                <option value="admin">Admin</option>
                </select>
          </div>

          <button
            className="btn btn-primary"
            style={{ marginTop: "16px" }}
            onClick={handleCreateUser}
          >
            Создать
          </button>
        </div>

        {/*  Таблица пользователей */}
        <div className="block" style={{ marginTop: "20px" }}>
          <h3>Пользователи</h3>

          {loading ? (
            <div className="loading-text">Загрузка...</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Никнейм</th>
                  <th>Роль</th>
                  <th>Действие</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.email}</td>
                    <td>{u.nickname}</td>
                    <td>{u.role}</td>
                    <td>
                      <select
                        className="input-field"
                        value={u.role}
                        onChange={(e) =>
                          changeRole(u.id, e.target.value)
                        }
                      >
                        <option value="participant">participant</option>
                        <option value="organizer">organizer</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}

export default AdminPanel;