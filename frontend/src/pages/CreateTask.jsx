import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { MdDelete } from "react-icons/md";
import { createTask, getTaskCategories, getTaskDifficulties } from "../api/tasks";

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
    points: 500,
    is_contest_task: false, 
    make_visible_after_contest: false
  });
  
  const [testsFile, setTestsFile] = useState(null);
  const [solutionFile, setSolutionFile] = useState(null);

  const [examples, setExamples] = useState([
    { input: "", output: "" }
  ]);

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [cats, diffs] = await Promise.all([
          getTaskCategories(),
          getTaskDifficulties()
        ]);
        setCategories(cats);
        setDifficulties(diffs);
      } catch (err) {
        console.error("Failed to load references:", err);
      }
    };
    loadReferences();
  }, []);

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

  const clearFileInput = (inputId) => {
    const input = document.getElementById(inputId);
    if (input) input.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!testsFile || !solutionFile) { 
      alert("Загрузите файлы!"); 
      return; 
    }
    
    setLoading(true);
    
    const data = new FormData();
    
    Object.keys(formData).forEach(key => {
      if (key === 'is_contest_task' || key === 'make_visible_after_contest') return;
      data.append(key, formData[key]);
    });

    data.append("is_contest_task", formData.is_contest_task);
    data.append("make_visible_after", formData.make_visible_after_contest);
    data.append("examples_json", JSON.stringify(examples));
    data.append("tests_file", testsFile);
    data.append("solution_file", solutionFile);

    try {
      await createTask(data);
      
      alert("Задача создана!");
      navigate("/tasks");
      
    } catch (err) {
      console.error("Create task error:", err);
      alert(`Ошибка: ${err.message || "Не удалось создать задачу"}`);
    } finally {
      setLoading(false);
    }
  };

  const isContestTask = formData.is_contest_task;

  return (
    <div className="page-container task-form-page">
      <Navbar />
     
      <div className="task-form-container">
        <h1 className="form-title">Создать новую задачу</h1>
        
        <form onSubmit={handleSubmit} className="task-form">
          {/* Название */}
          <div className="form-group">
            <label className="label">Название</label>
            <input 
              required 
              type="text" 
              className="input-field" 
              value={formData.task_name} 
              onChange={e => setFormData({...formData, task_name: e.target.value})} 
            />
          </div>

          {/* Условие */}
          <div className="form-group">
            <label className="label">Условие (HTML/Text)</label>
            <textarea 
              required 
              rows="8" 
              className="input-field textarea"
              value={formData.statement} 
              onChange={e => setFormData({...formData, statement: e.target.value})} 
            />
          </div>

          {/* Форматы ввода/вывода */}
          <div className="grid-2">
            <div className="form-group">
              <label className="label">Формат входных данных</label>
              <textarea 
                rows="4" 
                className="input-field textarea"
                value={formData.input_format} 
                onChange={e => setFormData({...formData, input_format: e.target.value})} 
                placeholder="Опишите, что подается на вход..." 
              />
            </div>
            <div className="form-group">
              <label className="label">Формат выходных данных</label>
              <textarea 
                rows="4" 
                className="input-field textarea"
                value={formData.output_format} 
                onChange={e => setFormData({...formData, output_format: e.target.value})} 
                placeholder="Опишите, что нужно вывести..." 
              />
            </div>
          </div>

          {/* Категория и Сложность */}
          <div className="grid-2">
            <div className="form-group">
              <label className="label">Категория</label>
              <select 
                className="input-field" 
                value={formData.category_id} 
                onChange={e => setFormData({...formData, category_id: Number(e.target.value)})}
              >
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Сложность</label>
              <select 
                className="input-field"
                value={formData.difficulty_id} 
                onChange={e => setFormData({...formData, difficulty_id: Number(e.target.value)})}
              >
                {difficulties.map(diff => (
                  <option key={diff.difficulty_id} value={diff.difficulty_id}>
                    {diff.diff_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Лимиты */}
          <div className="grid-2">
            <div className="form-group">
              <label className="label">Время (мс)</label>
              <input 
                type="number" 
                className="input-field" 
                value={formData.time_limit} 
                onChange={e => setFormData({...formData, time_limit: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label className="label">Память (МБ)</label>
              <input 
                type="number" 
                className="input-field" 
                value={formData.memory_limit} 
                onChange={e => setFormData({...formData, memory_limit: e.target.value})} 
              />
            </div>
          </div>

          {/* Настройки публикации */}
          <div className="publish-settings">
            <label className="label publish-settings-title">
              Настройки публикации задачи
            </label>
            
            {/* Чекбокс: Для контеста */}
            <div className="checkbox-row">
              <input 
                type="checkbox" 
                id="is_contest_task"
                className="checkbox-input"
                checked={isContestTask}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setFormData({
                    ...formData, 
                    is_contest_task: isChecked,                
                    make_visible_after_contest: isChecked ? formData.make_visible_after_contest : false
                  });
                }}
              />
              <label htmlFor="is_contest_task" className="checkbox-label">
                Задача для контеста (скрыта из общего списка)
              </label>
            </div>

            {/* Начальная стоимость */}
            <div className="form-group">
              <label className="label">Начальная стоимость (баллы)</label>
              <select
                className="input-field"
                value={formData.points}
                onChange={(e) => setFormData({...formData, points: Number(e.target.value)})}
              >
                <option value={500}>500</option>
                <option value={1000}>1000</option>
                <option value={1500}>1500</option>
                <option value={2000}>2000</option>
                <option value={2500}>2500</option>
                <option value={3000}>3000</option>
              </select>
              <p className="hint-text">
                Стоимость задачи в контесте. Чем раньше участник решит задачу, тем больше баллов получит.
              </p>
            </div>

            {/* Чекбокс: Сделать видимой после контеста */}
            <div className={`checkbox-row ${!isContestTask ? 'disabled' : ''}`}>
              <input 
                type="checkbox" 
                id="make_visible_after"
                className={`checkbox-input ${!isContestTask ? 'disabled' : ''}`}
                checked={formData.make_visible_after_contest}
                onChange={(e) => setFormData({...formData, make_visible_after_contest: e.target.checked})}
                disabled={!isContestTask}
              />
              <label 
                htmlFor="make_visible_after" 
                className={`checkbox-label ${!isContestTask ? 'disabled' : ''}`}
              >
                Сделать видимой для всех после окончания контеста
              </label>
            </div>
            
            <p className="hint-text indent">
              {isContestTask 
                ? "Задача не будет видна в общем списке, пока вы не добавите её в контест. После завершения контеста она может стать публичной." 
                : "Задача будет сразу доступна в общем списке задач для всех пользователей."}
            </p>
          </div>

          {/* Примеры */}
          <div className="form-group">
            <div className="examples-header">
              <label className="label" style={{ margin: 0 }}>Примеры входных и выходных данных</label>
              <button 
                type="button" 
                onClick={addExample} 
                className="btn btn-sm btn-secondary btn-xs"
              >
                + Добавить пример
              </button>
            </div>
            
            <div className="examples-list">
              {examples.map((ex, index) => (
                <div key={index} className="example-item">
                  <div>
                    <span className="example-field-label">Входные данные</span>
                    <textarea 
                      rows="3" 
                      className="input-field textarea example-textarea" 
                      placeholder="Например: 5 10" 
                      value={ex.input} 
                      onChange={(e) => updateExample(index, 'input', e.target.value)} 
                    />
                  </div>
                  <div>
                    <span className="example-field-label">Выходные данные</span>
                    <textarea 
                      rows="3" 
                      className="input-field textarea example-textarea" 
                      placeholder="Например: 15" 
                      value={ex.output} 
                      onChange={(e) => updateExample(index, 'output', e.target.value)} 
                    />
                  </div>
                  <div style={{ paddingTop: '20px' }}>
                    <button 
                      type="button" 
                      onClick={() => removeExample(index)} 
                      disabled={examples.length === 1} 
                      className="remove-example-btn"
                      title="Удалить пример"
                    >
                      <MdDelete color="#0e0e0e" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Файлы */}
          <div className="form-group file-section">
            <label className="label">Файлы</label>
            
            {/* Архив с тестами */}
            <div className="file-input-group">
              <span className="file-hint">Архив с тестами (.zip с файлами .in)</span>
              <div className="file-row">
                <input 
                  type="file" 
                  accept=".zip" 
                  required 
                  onChange={e => setTestsFile(e.target.files[0])} 
                  className="file-input" 
                  id="tests-file-input" 
                />
                {testsFile && (
                  <button 
                    type="button" 
                    onClick={() => { 
                      setTestsFile(null); 
                      clearFileInput('tests-file-input'); 
                    }} 
                    className="file-remove-btn"
                    title="Удалить файл"
                  >
                    ✕
                  </button>
                )}
              </div>
              {testsFile && (
                <div className="file-name">
                  Выбран: <strong>{testsFile.name}</strong>
                </div>
              )}
            </div>
            
            {/* Решение */}
            <div className="file-input-group">
              <span className="file-hint">Эталонное решение (.py или .cpp)</span>
              <div className="file-row">
                <input 
                  type="file" 
                  accept=".py,.cpp" 
                  required 
                  onChange={e => setSolutionFile(e.target.files[0])} 
                  className="file-input" 
                  id="solution-file-input" 
                />
                {solutionFile && (
                  <button 
                    type="button" 
                    onClick={() => { 
                      setSolutionFile(null); 
                      clearFileInput('solution-file-input'); 
                    }} 
                    className="file-remove-btn"
                    title="Удалить файл"
                  >
                    ✕
                  </button>
                )}
              </div>
              {solutionFile && (
                <div className="file-name">
                  Выбран: <strong>{solutionFile.name}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Создание..." : "Создать задачу"}
            </button>
            <button 
              type="button" 
              onClick={() => navigate("/tasks")} 
              className="btn btn-secondary"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTask;