# Group 16 - Noah and Victor AI Guidebook

## 🚀 Features

The main interface features a powerful sidebar dashboard that displays a chronological history of past chats (grouped by course) and allows you to start new conversations. The main screen dynamically displays either your active conversation or the main piloting screen.

### 🗂️ Conversation & Course Management
* **Academic vs. Private Modes:** Easily toggle conversations between "Academic" and "Private" modes directly from the sidebar.
* **Custom Course Categories:** Group your academic chats by creating custom course categories. You can freely create, rename, or delete courses (note: deleting a course prompts a warning, as it will also delete all associated conversations).
* **Chat Controls:** Start new conversations, assign them to specific courses, and freely rename or delete individual chats at any time.
* **Chronological History:** All chats are grouped by course and ordered by their most recent update, allowing you to easily retrieve and resume past sessions.

### 🛠️ Specialized Tools
* **Brainstorming Mode:** Click the **Lightbulb** button to activate Brainstorming Mode. All generated prompts and associated AI responses are logged on the right side of the screen and saved in a dedicated database section for easy reference.
* **File Sandbox:** Securely upload and store documents in an isolated sandbox. A confirmation prompt prevents accidental uploads, and confirmed documents are safely stored in a dedicated database section.

### 🧭 Navigation & User Experience
* **Seamless Navigation:** Jump between active chats and the main dashboard in a single click by selecting "Ai Guidebook" in the top-left sidebar.
* **Integrated Feedback System:** Submit feedback and comments regarding the app's functionality at any time. Your feedback history is stored securely and remains accessible for review.
* **Content Moderation:** Flag specific AI responses for review (e.g., if a comment is biased or inappropriate). Flagged messages are stored in a dedicated database segment for administrators or reviewers to evaluate.

---

## 💻 Local Installation & Setup

To run this project locally on your machine, please follow the steps below:

### Prerequisites
* [Node.js](https://nodejs.org/) installed on your machine.
* Access to the project's MongoDB connection string (you can find this in the associated PDF document on Blackboard or InnSpill).

### Step-by-Step Guide

**1. Clone the repository**
Navigate to your desired directory in the terminal and clone the repository.

**2. Install dependencies**
All required packages are listed in the `package.json` file. Install them by running:
```bash
npm install