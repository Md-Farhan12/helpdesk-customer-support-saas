# Helpdesk & Customer Support Ticketing SaaS

A full-stack customer support ticketing platform for managing customer support requests, support agents, ticket workflows, and service operations.

## Project Status

🚧 **Review-I MVP — Day 11**

The MVP currently supports authentication, role-based access, customer ticket creation, ticket management, agent assignment, ticket comments, and administrator management.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 |
| Frontend Build Tool | Vite |
| Backend | FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Database Driver | psycopg |
| Authentication | JWT |
| Password Hashing | Argon2 |
| Validation | Pydantic |
| API Documentation | FastAPI Swagger / OpenAPI |
| Testing | Pytest |
| Version Control | Git / GitHub |

## User Roles

### Customer

- Sign up and log in
- Create support tickets
- View own tickets
- View ticket details
- Add ticket comments
- Update permitted ticket information

### Support Agent

- Log in
- View support tickets
- View assigned tickets
- Update ticket status
- Add ticket comments
- Manage ticket workflow

### Administrator

- Log in
- View all tickets
- Assign tickets to support agents
- Manage users
- Manage support operations

## Core Features

- JWT-based authentication
- Role-based authorization
- Customer ticket management
- Ticket assignment
- Ticket status workflow
- Ticket comments
- Category management
- Priority management
- Administrator management
- PostgreSQL database persistence

## System Architecture

The application follows a layered architecture:

```text
React Frontend
      ↓
FastAPI API Routers
      ↓
Services
      ↓
Repositories
      ↓
SQLAlchemy Models
      ↓
PostgreSQL