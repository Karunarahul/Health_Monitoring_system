Health Monitoring System
Live demo

https://glowing-alfajores-a227c8.netlify.app
Overview This repository implements a Health Monitoring System — a web application that collects, stores, and visualizes health-related data (e.g., vitals, sensor readings). It provides a frontend interface for data entry and visualization and a backend API for storing and retrieving time-series health data. The project is implemented primarily in TypeScript with additional JavaScript and PL/pgSQL for database-related logic.

Key features

User interface for submitting and viewing health metrics
Real-time or periodic visualization of time-series data (charts/dashboards)
Backend API for data ingestion and querying
Database functions (PL/pgSQL) for data processing or aggregation
Ready-to-deploy frontend (Netlify demo link above)
Tech stack

Frontend: TypeScript, React (inferred from TypeScript composition)
Backend: TypeScript/Node.js (API server)
Database: PostgreSQL with PL/pgSQL functions
Deployment: Netlify (frontend demo link)
How to run locally (high-level)

Clone the repository: git clone https://github.com/Karunarahul/Health_Monitoring_system.git
Install dependencies:
cd into frontend and backend directories (if separated) and run npm install or yarn
Set environment variables:
Configure database URL, API keys, and any other required secrets
Run database migrations / apply SQL functions:
Use psql or your migration tool to create the schema and PL/pgSQL functions
Start services:
Start the backend server (npm run dev)
Start the frontend (npm start or npm run build && serve)
Open the frontend or visit the Netlify demo for a deployed preview
Repository composition

Languages: ~76% TypeScript, ~22% JavaScript, ~2% PL/pgSQL
The codebase is strongly TypeScript-focused, indicating typed frontend/backend code and modern tooling.
