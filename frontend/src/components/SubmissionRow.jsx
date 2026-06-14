import { useSolutionPolling } from "../hooks/useSolutionPolling";

const SubmissionRow = ({ solution, index, showUser = true }) => {
  const FINAL_STATUSES_DB = [
    "Accepted", "Wrong Answer", "Time Limit Exceeded", 
    "Memory Limit Exceeded", "Runtime Error", "Compilation Error"
  ];

  const needsPolling = !FINAL_STATUSES_DB.includes(solution.status);
  
  const { status: polledStatus, result } = useSolutionPolling(
    needsPolling ? solution.id : null
  );

  const displayStatus = result?.verdict || polledStatus || solution.status;

  const getVerdictColor = (verdict) => {
    switch (verdict) {
      case "Accepted":
        return "#10b981"; 
      case "Wrong Answer":
        return "#f59e0b"; 
      case "Time Limit Exceeded":
      case "Memory Limit Exceeded":
      case "Runtime Error":
        return "#ef4444"; 
      case "Compilation Error":
        return "#6b7280"; 
      case "Pending":
      case "In Queue":
        return "#9ca3af"; 
      case "Processing":
        return "#3b82f6"; 
      default:
        return "#6b7280";
    }
  };

  return (
    <tr>
      <td className="td">{index + 1}</td>
      <td className="td">{new Date(solution.time).toLocaleString()}</td>
      
      {showUser && (
        <td className="td">{solution.user || "-"}</td>
      )}
      
      <td className="td">{solution.task || "-"}</td>
      <td className="td">{solution.language || "-"}</td>
      <td className="td">
        <span style={{ 
          color: getVerdictColor(displayStatus),
          fontWeight: displayStatus === "Accepted" ? "600" : "400"
        }}>
          {displayStatus}
        </span>
      </td>
    </tr>
  );
};

export default SubmissionRow;