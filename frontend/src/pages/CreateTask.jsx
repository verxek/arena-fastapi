// frontend/src/pages/CreateTask.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function CreateTask() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [difficulties, setDifficulties] = useState([]);

  const [formData, setFormData] = useState({
    task_name: "", 
    statement: "", 
    input_format: "",    
    output_format: "",   
    category_id: 19, 
    difficulty_id: 1,
    time_limit: 1000, 
    memory_limit: 256,
    is_contest_task: false, 
    make_visible_after_contest: false
  });
  
  const [testsFile, setTestsFile] = useState(null);
  const [solutionFile, setSolutionFile] = useState(null);

  const [examples, setExamples] = useState([
    { input: "", output: "" }
  ]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    fetch("http://127.0.0.1:8000/tasks/categories", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error(err));

    fetch("http://127.0.0.1:8000/tasks/difficulties", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setDifficulties(data))
      .catch(err => console.error(err));
  }, []);

  // Функции управления примерами
  const addExample = () => setExamples([...examples, { input: "", output: "" }]);
  const removeExample = (index) => {
    const newExamples = examples.filter((_, i) => i !== index);
    setExamples(newExamples.length ? newExamples : [{ input: "", output: "" }]);
  };
  const updateExample = (index, field, value) => {
    const newExamples = [...examples];
    newExamples[index][field] = value;
    setExamples(newExamples);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!testsFile || !solutionFile) { alert("Загрузите файлы!"); return; }
    
    setLoading(true);
    const token = localStorage.getItem("access_token");
    const data = new FormData();
    
    Object.keys(formData).forEach(key => {
      if (key === 'is_contest_task' || key === 'make_visible_after_contest') return;
      data.append(key, formData[key]);
    });


    const visibility = !formData.is_contest_task;
    data.append("visibility", visibility);
    

    data.append("make_visible_after_contest", formData.make_visible_after_contest);

    data.append("examples_json", JSON.stringify(examples));
    data.append("tests_file", testsFile);
    data.append("solution_file", solutionFile);

    try {
      const res = await fetch("http://127.0.0.1:8000/tasks/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });
      if (res.ok) {
        alert("Задача создана!");
        navigate("/tasks");
      } else {
        const err = await res.json();
        alert(`Ошибка: ${err.detail}`);
      }
    } catch (err) {
      alert("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      <Navbar />
     
      <div style={{
        position: "absolute", top: "140px", left: "50%", transform: "translateX(-50%)",
        width: "90%", maxWidth: "1200px", boxSizing: "border-box", paddingBottom: "40px" 
      }}>
        <h1 className="form-title">Создать новую задачу</h1>
        
        <form onSubmit={handleSubmit} className="task-form">
          {/* Название */}
          <div className="form-group">
            <label className="label">Название</label>
            <input required type="text" className="input-field" 
              value={formData.task_name} onChange={e => setFormData({...formData, task_name: e.target.value})} />
          </div>

          {/* Условие */}
          <div className="form-group">
            <label className="label">Условие (HTML/Text)</label>
            <textarea required rows="8" className="input-field textarea"
              value={formData.statement} onChange={e => setFormData({...formData, statement: e.target.value})} />
          </div>

          {/* Форматы ввода/вывода */}
          <div className="grid-2">
            <div className="form-group">
              <label className="label">Формат входных данных</label>
              <textarea rows="4" className="input-field textarea"
                value={formData.input_format} onChange={e => setFormData({...formData, input_format: e.target.value})} 
                placeholder="Опишите, что подается на вход..." />
            </div>
            <div className="form-group">
              <label className="label">Формат выходных данных</label>
              <textarea rows="4" className="input-field textarea"
                value={formData.output_format} onChange={e => setFormData({...formData, output_format: e.target.value})} 
                placeholder="Опишите, что нужно вывести..." />
            </div>
          </div>

          {/* Категория и Сложность */}
          <div className="grid-2">
            <div className="form-group">
              <label className="label">Категория</label>
              <select className="input-field" 
                value={formData.category_id} onChange={e => setFormData({...formData, category_id: Number(e.target.value)})}>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Сложность</label>
              <select className="input-field"
                value={formData.difficulty_id} onChange={e => setFormData({...formData, difficulty_id: Number(e.target.value)})}>
                {difficulties.map(diff => (
                  <option key={diff.difficulty_id} value={diff.difficulty_id}>{diff.diff_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Лимиты */}
          <div className="grid-2">
            <div className="form-group">
              <label className="label">Время (мс)</label>
              <input type="number" className="input-field" 
                value={formData.time_limit} onChange={e => setFormData({...formData, time_limit: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="label">Память (МБ)</label>
              <input type="number" className="input-field" 
                value={formData.memory_limit} onChange={e => setFormData({...formData, memory_limit: e.target.value})} />
            </div>
          </div>

          <div className="form-group" style={{ 
            background: "#fff", padding: "20px", borderRadius: "8px", 
            border: "1px solid #e5e7eb", marginBottom: "20px" 
          }}>
            <label className="label" style={{ marginBottom: "15px", display: "block" }}>
              Настройки публикации задачи
            </label>
            
            {/* Чекбокс 1: Для контеста */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
              <input 
                type="checkbox" 
                id="is_contest_task"
                checked={formData.is_contest_task}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setFormData({
                    ...formData, 
                    is_contest_task: isChecked,                
                    make_visible_after_contest: isChecked ? formData.make_visible_after_contest : false
                  });
                }}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <label htmlFor="is_contest_task" style={{ fontWeight: "500", cursor: "pointer", color: "#1f2739" }}>
                Задача для контеста (скрыта из общего списка)
              </label>
            </div>

            <div style={{ 
              display: "flex", alignItems: "center", gap: "10px", 
              opacity: formData.is_contest_task ? 1 : 0.5, 
              pointerEvents: formData.is_contest_task ? "auto" : "none" 
            }}>
              <input 
                type="checkbox" 
                id="make_visible_after"
                checked={formData.make_visible_after_contest}
                onChange={(e) => setFormData({...formData, make_visible_after_contest: e.target.checked})}
                disabled={!formData.is_contest_task} // Программная блокировка
                style={{ width: "18px", height: "18px", cursor: formData.is_contest_task ? "pointer" : "not-allowed" }}
              />
              <label htmlFor="make_visible_after" style={{ fontWeight: "500", cursor: formData.is_contest_task ? "pointer" : "not-allowed", color: "#1f2739" }}>
                Сделать видимой для всех после окончания контеста
              </label>
            </div>
            
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "10px", marginLeft: "28px" }}>
              {formData.is_contest_task 
                ? "Задача не будет видна в общем списке, пока вы не добавите её в контест. После завершения контеста она может стать публичной." 
                : "Задача будет сразу доступна в общем списке задач для всех пользователей."}
            </p>
          </div>

          {/* Таблица примеров */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label className="label" style={{ margin: 0 }}>Примеры входных и выходных данных</label>
              <button type="button" onClick={addExample} className="btn btn-sm btn-secondary" style={{ fontSize: '12px', padding: '4px 8px' }}>
                + Добавить пример
              </button>
            </div>
            {/* ... (код таблицы примеров остается без изменений) ... */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {examples.map((ex, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'start', background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Входные данные</span>
                    <textarea rows="3" className="input-field textarea" placeholder="Например: 5 10" value={ex.input} onChange={(e) => updateExample(index, 'input', e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Выходные данные</span>
                    <textarea rows="3" className="input-field textarea" placeholder="Например: 15" value={ex.output} onChange={(e) => updateExample(index, 'output', e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
                  </div>
                  <div style={{ paddingTop: '20px' }}>
                    <button type="button" onClick={() => removeExample(index)} disabled={examples.length === 1} style={{ background: examples.length === 1 ? '#f3f4f6' : '#fee2e2', color: examples.length === 1 ? '#9ca3af' : '#ef4444', border: 'none', borderRadius: '6px', width: '32px', height: '32px', cursor: examples.length === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }} title="Удалить пример">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Файлы (с кнопками удаления) */}
          <div className="form-group file-section">
            <label className="label">Файлы</label>
            {/* Архив с тестами */}
            <div className="file-input-group" style={{ position: 'relative', marginBottom: '15px' }}>
              <span className="file-hint">Архив с тестами (.zip с файлами .in)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="file" accept=".zip" required onChange={e => setTestsFile(e.target.files[0])} className="file-input" id="tests-file-input" />
                {testsFile && (
                  <button type="button" onClick={() => { setTestsFile(null); document.getElementById('tests-file-input').value = ''; }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }} title="Удалить файл">✕</button>
                )}
              </div>
              {testsFile && <div style={{ fontSize: '13px', color: '#1f2739', marginTop: '4px', marginLeft: '2px' }}>Выбран: <strong>{testsFile.name}</strong></div>}
            </div>
            {/* Решение */}
            <div className="file-input-group" style={{ position: 'relative' }}>
              <span className="file-hint">Эталонное решение (.py или .cpp)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="file" accept=".py,.cpp" required onChange={e => setSolutionFile(e.target.files[0])} className="file-input" id="solution-file-input" />
                {solutionFile && (
                  <button type="button" onClick={() => { setSolutionFile(null); document.getElementById('solution-file-input').value = ''; }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }} title="Удалить файл">✕</button>
                )}
              </div>
              {solutionFile && <div style={{ fontSize: '13px', color: '#1f2739', marginTop: '4px', marginLeft: '2px' }}>Выбран: <strong>{solutionFile.name}</strong></div>}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Создание..." : "Создать задачу"}
            </button>
            <button type="button" onClick={() => navigate("/tasks")} className="btn btn-secondary">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTask;