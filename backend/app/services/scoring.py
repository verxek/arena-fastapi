from datetime import datetime, timedelta
from collections import defaultdict

def calculate_contest_rating(contest, participants, solutions, tasks_ordered):
    """
    tasks_ordered: список объектов задач в правильном порядке (A, B, C...)
    """
    contest_start = contest.start_time
    contest_end = contest.start_time + timedelta(minutes=contest.duration)
    duration_seconds = contest.duration * 60
    
    # Группируем решения по пользователям
    solutions_by_user = defaultdict(list)
    for s in solutions:
        solutions_by_user[s.sol_user].append(s)

    result = []

    for user in participants:
        user_solutions = solutions_by_user.get(user.user_id, [])
        
        solved_tasks = []
        total_score = 0
        total_penalty_time = 0 

        for task in tasks_ordered:
            task_id = task.task_id
            base_points = task.points or 500 # Защита от None
            
            # Фильтруем попытки только для этой задачи и в рамках времени контеста
            attempts = [
                s for s in user_solutions
                if s.sol_task == task_id
                and contest_start <= s.sol_created_at <= contest_end
            ]
            # Сортируем по времени сдачи (от старых к новым)
            attempts.sort(key=lambda x: x.sol_created_at)

            wrong_attempts = 0
            solved = False
            task_score = 0

            for attempt in attempts:
                if attempt.is_accepted:
                    task_score = calculate_task_score(
                        base_points=base_points,
                        contest_start=contest_start,
                        contest_end=contest_end,
                        solve_time=attempt.sol_created_at,
                        wrong_attempts=wrong_attempts
                    )

                    solved = True
                    break
                else:
                    # Считаем штрафы только за реальные ошибки (не Compilation Error)
                    state_name = attempt.state_rel.state_name if attempt.state_rel else ""
                    if state_name != "Compilation Error":
                        wrong_attempts += 1
            
            if not solved:
                task_score = 0

            solved_tasks.append({
                "task_id": task_id,
                "score": task_score,
                "wrong_attempts": wrong_attempts 
            })
            
            total_score += task_score
            
            if solved:
                # Находим время принятой попытки
                solved_attempt = next(a for a in attempts if a.is_accepted)
                total_penalty_time += int((solved_attempt.sol_created_at - contest_start).total_seconds())

        result.append({
            "user_id": user.user_id,
            "nickname": user.nickname,
            "score": int(total_score),
            "solved": sum(1 for t in solved_tasks if t["score"] > 0),
            "penalty_time": total_penalty_time,
            "tasks": solved_tasks
        })

    # Сортировка: 
    # 1. Решено (по убыванию) 
    # 2. Очки (по убыванию) 
    # 3. Время (по возрастанию)
    result.sort(key=lambda x: (-x["solved"], -x["score"], x["penalty_time"]))

    # Присваиваем ранги
    for i, row in enumerate(result, start=1):
        row["rank"] = i

    return result


def calculate_task_score(
    base_points: int,
    contest_start: datetime,
    contest_end: datetime,
    solve_time: datetime,
    wrong_attempts: int
) -> int:
    """
    Расчет очков за задачу (Codeforces-style)
    """
    if not solve_time:
        return 0

    duration_seconds = (contest_end - contest_start).total_seconds()
    passed_seconds = (solve_time - contest_start).total_seconds()

    # Доля прошедшего времени (0.0 -> 1.0)
    time_ratio = passed_seconds / duration_seconds if duration_seconds > 0 else 0

    # Линейное падение стоимости: от 100% до 30%
    # Формула: Points = Base * (1 - 0.7 * ratio)
    decayed_points = base_points * (1 - 0.7 * time_ratio)
    
    # Штраф за ошибки
    penalty = wrong_attempts * 50

    # Итоговая формула
    final_score = decayed_points - penalty

    min_score = base_points * 0.3
    
    return max(int(final_score), int(min_score))