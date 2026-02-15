import React, { useState, useEffect } from "react";
import axios from "axios";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { BrowserRouter, Routes, Route, useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const API = "/api/polls";
const WS_URL = "/ws";

/* ---------------- TOKEN INIT ---------------- */
function initToken() {
  let token = localStorage.getItem("poll_token");
  if (!token) {
    token = uuidv4();
    localStorage.setItem("poll_token", token);
  }
  return token;
}

/* ---------------- HOME PAGE ---------------- */
function Home() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  useEffect(() => {
    initToken();
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    const res = await axios.get(API);
    setPolls(res.data);
  };

  const createPoll = async () => {
    const validOptions = options.filter(o => o.trim() !== "");
    if (!question.trim() || validOptions.length < 2) {
      alert("Enter question and at least 2 options");
      return;
    }

    const res = await axios.post(API, {
      question,
      options: validOptions.map(text => ({
        text,
        voteCount: 0
      }))
    });

    navigate(`/poll/${res.data.id}`);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Real-Time Polling</h1>

      <div style={styles.card}>
        <h2>Create Poll</h2>

        <input
          style={styles.input}
          placeholder="Question"
          value={question}
          onChange={e => setQuestion(e.target.value)}
        />

        {options.map((opt, i) => (
          <input
            key={i}
            style={styles.input}
            placeholder={`Option ${i + 1}`}
            value={opt}
            onChange={e => {
              const newOptions = [...options];
              newOptions[i] = e.target.value;
              setOptions(newOptions);
            }}
          />
        ))}

        <button
          style={styles.secondaryButton}
          onClick={() => setOptions([...options, ""])}
        >
          Add Option
        </button>

        <button style={styles.primaryButton} onClick={createPoll}>
          Create Poll
        </button>
      </div>

      <h2 style={{ marginTop: 40 }}>Available Polls</h2>

      {polls.map(p => (
        <div key={p.id} style={styles.pollCard}>
          <strong>{p.question}</strong>
          <button
            style={styles.primaryButton}
            onClick={() => navigate(`/poll/${p.id}`)}
          >
            Open
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------------- POLL PAGE ---------------- */
function PollPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    loadPoll();
    connectWebSocket();
  }, [id]);

  const loadPoll = async () => {
    const res = await axios.get(`${API}/${id}`);
    setPoll(res.data);
  };

  const vote = async (optionId) => {
    const token = localStorage.getItem("poll_token");

    try {
      await axios.post(
        `${API}/${id}/vote/${optionId}`,
        {},
        { headers: { "X-User-Token": token } }
      );
      setHasVoted(true);
    } catch (err) {
      if (err.response?.status === 400) {
        alert("You already voted in this poll.");
        setHasVoted(true);
      }
    }
  };

  const connectWebSocket = () => {
    const socket = new SockJS(WS_URL);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/poll/${id}`, (message) => {
          setPoll(JSON.parse(message.body));
        });
      }
    });

    client.activate();
  };

  if (!poll) return <div style={styles.container}>Loading...</div>;

  const totalVotes = poll.options.reduce(
    (sum, opt) => sum + opt.voteCount,
    0
  );

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={() => navigate("/")}>
        ← Back
      </button>

      <h2>{poll.question}</h2>

      <p>
        Share this link:
        <br />
        <strong>{window.location.href}</strong>
      </p>

      <p>Total Votes: {totalVotes}</p>

      {poll.options.map(opt => {
        const percentage =
          totalVotes === 0
            ? 0
            : ((opt.voteCount / totalVotes) * 100).toFixed(1);

        return (
          <div key={opt.id} style={{ marginBottom: 15 }}>
            <button
              style={{
                ...styles.voteButton,
                opacity: hasVoted ? 0.6 : 1
              }}
              disabled={hasVoted}
              onClick={() => vote(opt.id)}
            >
              {opt.text}
            </button>

            {hasVoted && (
              <>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${percentage}%`
                    }}
                  />
                </div>
                <small>
                  {opt.voteCount} votes ({percentage}%)
                </small>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- MAIN APP ---------------- */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/poll/:id" element={<PollPage />} />
      </Routes>
    </BrowserRouter>
  );
}

/* ---------------- STYLES ---------------- */
const styles = {
  container: {
    maxWidth: 600,
    margin: "auto",
    padding: 20,
    fontFamily: "Arial"
  },
  title: { textAlign: "center" },
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
  },
  pollCard: {
    background: "#f8f8f8",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
    border: "1px solid #ddd"
  },
  primaryButton: {
    padding: "8px 14px",
    borderRadius: 6,
    border: "none",
    background: "#4CAF50",
    color: "white",
    cursor: "pointer",
    marginTop: 10
  },
  secondaryButton: {
    padding: "6px 12px",
    borderRadius: 6,
    border: "none",
    background: "#888",
    color: "white",
    cursor: "pointer",
    marginRight: 10
  },
  voteButton: {
    width: "100%",
    padding: 10,
    borderRadius: 6,
    border: "none",
    background: "#2196F3",
    color: "white",
    cursor: "pointer"
  },
  progressBar: {
    height: 8,
    background: "#ddd",
    borderRadius: 4,
    marginTop: 5
  },
  progressFill: {
    height: "100%",
    background: "#4CAF50",
    borderRadius: 4
  },
  backButton: {
    marginBottom: 10,
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#555"
  }
};

export default App;
