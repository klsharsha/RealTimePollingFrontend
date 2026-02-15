# Real-Time Polling Application

## Live Application

Public URL:  
http://51.20.34.19/

---

## GitHub Repositories

Backend (Spring Boot):  
https://github.com/klsharsha/RealTimePollingBackend  

Frontend (React):  
https://github.com/klsharsha/RealTimePollingFrontend  

---

# Overview

This is a full-stack real-time polling web application built using:

- Frontend: React  
- Backend: Spring Boot  
- Database: MySQL (MariaDB on AWS EC2)  
- Real-Time Communication: WebSockets (STOMP + SockJS)  
- Deployment: AWS EC2 + Nginx reverse proxy  

The application allows users to:

- Create polls  
- Share polls via unique links  
- Vote once per poll  
- See live vote updates without refreshing  
- Persist polls and votes in a database  

---

# Features Implemented

## 1. Poll Creation

- User can create a poll with:
  - A question
  - Minimum 2 options
- Poll is stored in MySQL database
- A shareable link is generated:

Example:
http://51.20.34.19/poll/3  

---

## 2. Join by Shareable Link

Anyone with the link can:

- Open the poll
- View options
- Vote once

Routing used:
`/poll/:id`

The poll automatically loads when accessed directly via URL.

---

## 3. Real-Time Results

When a user votes:

1. Backend updates vote count in database
2. Backend broadcasts updated poll using WebSocket
3. All connected clients receive update instantly
4. UI updates automatically without refresh

WebSocket topic format:
`/topic/poll/{id}`

---

# Fairness / Anti-Abuse Mechanisms

The application implements two anti-abuse controls.

---

## Mechanism 1: Unique Browser Token

Each browser is assigned a unique UUID stored in `localStorage`.

- Token is sent in request header:
  `X-User-Token`
- Backend checks if token has already voted in that poll
- If yes → vote rejected (HTTP 400)
- If no → vote recorded

### Prevents:
- Double voting from same browser  
- Accidental duplicate clicks  
- Refresh-based re-voting  

### Limitation:
- Clearing browser storage allows new vote  
- Different devices can vote separately  

---

## Mechanism 2: Database-Level Unique Constraint

The Vote table enforces uniqueness on:

(poll_id, user_token)

Even if someone:
- Uses Postman  
- Sends manual API requests  
- Attempts race conditions  

The database prevents duplicate entries.

### Prevents:
- Concurrent duplicate votes  
- API abuse  
- Script-based repeated voting  

### Limitation:
- Does not prevent multiple physical devices  

---

# Edge Cases Handled

- Poll must have at least 2 options  
- Question cannot be empty  
- Duplicate vote attempts rejected  
- Votes persist after refresh  
- Polls persist after server restart  
- Direct URL access works  
- Real-time multi-user updates  
- Handles page reload gracefully  

---

# Deployment Architecture

Browser  
↓  
Nginx (Port 80)  
↓  
- `/` → React static files  
- `/api` and `/ws` → Spring Boot (Port 8080)  
↓  
MySQL  

---

# Tech Stack

- React  
- Axios  
- SockJS  
- STOMP  
- Spring Boot  
- Spring WebSocket  
- Spring Data JPA  
- MySQL / MariaDB  
- Nginx  
- AWS EC2  

---

# Known Limitations

1. Token-based fairness is not fully secure  
   - Users can clear localStorage  
   - Users can use incognito mode  

2. No authentication system  
   - Voting is anonymous  

3. No poll expiration feature  

4. No rate limiting  

5. Single-instance deployment (no load balancing)  

---

# Future Improvements

If extended further, I would:

- Add JWT-based authentication  
- Add poll expiration feature  
- Add IP-based throttling / rate limiting  
- Add Redis pub/sub for scalable WebSocket broadcasting  
- Use AWS RDS instead of local DB  
- Add Docker-based deployment  
- Add analytics dashboard  
- Improve UI/UX design  
- Add QR code generation for poll sharing  

---

# Requirements Checklist

Poll Creation — Completed  
Shareable Link — Completed  
Join by Link — Completed  
Real-Time Results — Completed  
Two Anti-Abuse Controls — Completed  
Persistence — Completed  
Public Deployment — Completed  

---

# Conclusion

This project demonstrates:

- Full-stack development  
- Real-time system design  
- Database modeling  
- Anti-abuse thinking  
- AWS deployment  
- Production-ready architecture design  
