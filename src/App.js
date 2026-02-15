import React, { useState, useEffect } from "react";
import axios from "axios";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const API = "http://localhost:8080/api/polls";
const WS_URL = "http://localhost:8080/ws";

function App() {
  const [polls, setPolls] = useState([]);
  const [poll, setPoll] = useState(null);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    let token = localStorage.getItem("poll_token");
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem("poll_token", token);
    }
    fetchAllPolls();
  }, []);

  const fetchAllPolls = async () => {
    const res = await axios.get(API);
    setPolls(res.data);
  };

  const createPoll = async () => {
    await axios.post(API, {
      question,
      options: options.map((text) => ({ text }))
    });

    setQuestion("");
    setOptions(["", ""]);
    fetchAllPolls();
  };

  const joinPoll = async (id) => {
    const res = await axios.get(`${API}/${id}`);
    setPoll(res.data);
    setHasVoted(false);
    connectWebSocket(id);
  };

  const vote = async (optionId) => {
    const token = localStorage.getItem("poll_token");

    try {
      await axios.post(
        `${API}/${poll.id}/vote/${optionId}`,
        {},
        {
          headers: { "X-User-Token": token }
        }
      );
      setHasVoted(true);
    } catch (error) {
      if (error.response?.status === 400) {
        alert("You have already voted in this poll.");
        setHasVoted(true);
      }
    }
  };

  const connectWebSocket = (id) => {
    const socket = new SockJS(WS_URL);
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        client.subscribe(`/topic/poll/${id}`, (message) => {
          const updatedPoll = JSON.parse(message.body);
          setPoll(updatedPoll);
        });
      }
    });

    client.activate();
  };

  const totalVotes = poll
    ? poll.options.reduce((sum, opt) => sum + opt.voteCount, 0)
    : 0;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Real-Time Polling</h1>

      {!poll && (
        <>
          <div style={styles.card}>
            <h2>Create Poll</h2>
            <input
              style={styles.input}
              placeholder="Question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />

            {options.map((opt, i) => (
              <input
                key={i}
                style={styles.input}
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => {
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

          {polls.map((p) => (
            <div key={p.id} style={styles.pollCard}>
              <strong>{p.question}</strong>
              <button
                style={styles.primaryButton}
                onClick={() => joinPoll(p.id)}
              >
                Join
              </button>
            </div>
          ))}
        </>
      )}

      {poll && (
        <div style={styles.card}>
          <button style={styles.backButton} onClick={() => setPoll(null)}>
            ← Back
          </button>

          <h2>{poll.question}</h2>
          <p>Total Votes: {totalVotes}</p>

          {poll.options.map((opt) => {
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
                      ></div>
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
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: "auto",
    padding: 20,
    fontFamily: "Arial"
  },
  title: {
    textAlign: "center"
  },
  card: {
    background: "#ffffff",
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
