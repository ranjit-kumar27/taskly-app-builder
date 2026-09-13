# Taskly App Builder 🚀

**Taskly** is an AI-powered full-stack application builder that transforms natural-language prompts into functional, ready-to-run React applications.

The platform uses **Java, Spring Boot, Spring AI, Redis, React, Spring Security, and Server-Sent Events (SSE)** to provide AI-powered code generation, real-time code streaming, automatic code repair, and in-browser application previews.

Taskly allows users to describe an application using natural language and generates the corresponding React application dynamically, making the development process faster and more accessible.

---

## ✨ Features

### 🤖 AI-Powered Code Generation

* Generate React applications from natural-language prompts.
* Uses **Spring AI** to integrate generative AI capabilities.
* Processes structured prompts to improve generated code quality.
* Generates ready-to-run React application code dynamically.

### ⚡ Real-Time AI Code Streaming

Taskly uses **Server-Sent Events (SSE)** to stream AI-generated code to the frontend in real time.

Instead of waiting for the entire AI response, users can see the generated code progressively.

```text
AI Model
   │
   │ Generated Code
   ▼
Spring Boot Backend
   │
   │ SSE Stream
   ▼
React Frontend
   │
   ▼
Real-Time Code Display
```

This improves the perceived responsiveness of the application during AI generation.

---
## 🖥️ Project Screenshots 
<img width="1600" height="880" alt="2026-08-3 at 18 46 53 (2)" src="https://github.com/user-attachments/assets/978b945b-3a8b-4796-9169-3b0e283135a6" /> 
<img width="1600" height="880" alt="2026-08-4 at 18 46 53 (1)" src="https://github.com/user-attachments/assets/6216fbc5-469d-4fb0-b573-4d7ded260f7d" />

---



## 🖥️ Live Application Preview

Taskly provides an in-browser preview environment for generated React applications.

The workflow is:

```text
Natural Language Prompt
          │
          ▼
     AI Generation
          │
          ▼
    React Source Code
          │
          ▼
   Compile / Execute
          │
          ▼
    Live Application
       Preview
```

Users can therefore move from an idea to a working application without manually creating the initial project structure.

---

## 🔧 Automatic Code Repair

AI-generated code may sometimes contain syntax or implementation issues.

Taskly includes an automatic repair mechanism that helps identify and correct generated code problems before the application is presented for preview.

This improves the reliability of AI-generated applications and reduces the need for manual corrections.

---

## 🔐 Authentication & Authorization

The backend APIs are secured using **Spring Security**.

Security functionality includes:

* User authentication
* Authorization
* Role-Based Access Control (RBAC)
* Protected REST APIs
* Project-level access control

---

## 📧 Email Invitation Workflow

Taskly supports an email-based invitation workflow that allows users to invite other users to collaborate on projects.

The workflow can be represented as:

```text
Project Owner
     │
     │ Send Invitation
     ▼
Email Invitation
     │
     ▼
Invited User
     │
     ▼
Project Access
```

---

## 🔗 Generated Project URLs

One of the important parts of Taskly is storing the URLs of generated projects.

When Taskly creates and makes a generated application available, the resulting **project URL is stored in Redis**.

```text
Generated Application
        │
        ▼
   Project URL
        │
        ▼
      Redis
        │
        ▼
 Retrieve Project URL
        │
        ▼
 Access Generated App
```

### Redis Usage

Redis is primarily used in Taskly for:

* Storing generated project URLs
* Quickly retrieving project URLs
* Providing fast access to generated application locations

This allows the application to efficiently map generated projects to their accessible URLs.

---

## 💳 Token-Based AI Usage

Taskly uses a token-based model to monitor AI consumption.

The system can track AI usage and apply generation limits based on the user's subscription tier.

```text
User
 │
 ▼
AI Generation Request
 │
 ▼
Token Consumption
 │
 ▼
Usage Tracking
 │
 ▼
Subscription Limit
 │
 ├── Within Limit
 │       │
 │       ▼
 │   Generate App
 │
 └── Limit Exceeded
         │
         ▼
      Reject Request
```

This provides the foundation for implementing usage-based AI billing and subscription plans.

---

## 🏗️ System Architecture


<img width="741" height="570" alt="image" src="https://github.com/user-attachments/assets/67bd27d1-e1b8-4389-85be-da4df83c501a" />




---

## 🔄 Application Workflow

### Step 1 — Enter Prompt

The user describes the application they want to create.

Example:

```text
Create a task management application with a dashboard,
sidebar navigation, task creation, and task filtering.
```

### Step 2 — Backend Processing

The React frontend sends the prompt to the Spring Boot backend through a REST API.

### Step 3 — AI Code Generation

Spring AI processes the prompt and communicates with the configured AI model to generate the required React application.

### Step 4 — Real-Time Streaming

The generated response is streamed back to the frontend using SSE.

```text
AI Response
    │
    ├── Code chunk 1 ──► Frontend
    ├── Code chunk 2 ──► Frontend
    ├── Code chunk 3 ──► Frontend
    ├── Code chunk 4 ──► Frontend
    │
    ▼
Complete React Application
```

### Step 5 — Code Repair

The generated code is checked and automatic repair mechanisms are used when necessary.

### Step 6 — Application Preview

The generated React application is compiled and rendered in the browser.

### Step 7 — Project URL Storage

The generated application's project URL is stored in **Redis**, allowing it to be retrieved efficiently.

---

## 🛠️ Tech Stack

### Backend

* **Java**
* **Spring Boot**
* **Spring AI**
* **Spring Security**
* **REST APIs**
* **Server-Sent Events (SSE)**

### Frontend

* **React**
* **TypeScript / JavaScript**
* Dynamic React code rendering
* In-browser live preview

### Data & Storage

* **Redis**
* Generated project URL storage
* Fast project URL retrieval

### Build & Development

* **Maven**
* **Git**
* **GitHub**
* **IntelliJ IDEA**
* **Postman**

---

## 🧪 Example Prompt

Try a prompt such as:

```text
Create a modern expense tracker with a dashboard,
monthly spending statistics, category filters,
and a form to add new expenses.
```

Taskly processes the prompt, generates the React application, streams the generated code in real time, and provides a live preview.

---

## 📈 Key Engineering Highlights

* Built an AI-powered application generation workflow using **Spring AI**.
* Implemented **SSE-based real-time AI code streaming**.
* Developed dynamic **React application generation and live preview**.
* Implemented automatic code repair for generated applications.
* Designed secure REST APIs using **Spring Security**.
* Implemented **Role-Based Access Control (RBAC)**.
* Integrated **Redis for generated project URL storage and fast retrieval**.
* Built an email-based project invitation workflow.
* Implemented token-based AI usage tracking and generation limits.
* Designed the application as a full-stack SaaS-style platform.

---
## 👨‍💻 Author

**Ranjit Kumar**

Computer Science Undergraduate | Backend & Full-Stack Developer

### Technologies

```text
Java
Spring Boot
Spring AI
Spring Security
React
Redis
REST APIs
Server-Sent Events
AI Integration
RBAC
SaaS Development
```

