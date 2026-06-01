# 📦 Inventory & Order Management System

A full-stack web application for managing products, customers, orders, and inventory tracking.

## Tech Stack
| Layer      | Technology                        |
|------------|-----------------------------------|
| Backend    | Python + FastAPI                  |
| Frontend   | React.js 18                       |
| Database   | PostgreSQL                        |
| ORM        | SQLAlchemy                        |
| Container  | Docker + Docker Compose           |

---

## Business Rules Implemented
- ✅ Unique product SKUs enforced
- ✅ Unique customer emails enforced
- ✅ Inventory validation before order placement
- ✅ Automatic stock reduction when orders are placed
- ✅ Orders blocked when stock is insufficient
- ✅ Stock restored when orders are cancelled/deleted

---

## Quick Start (Docker — Recommended)

### Prerequisites
- Docker Desktop installed → https://www.docker.com/products/docker-desktop

### Steps

1. Copy the `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Build and start all services:
```bash
docker-compose up --build
```

3. Open in browser:
- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs
- **API Health:** http://localhost:8000/api/health

---

## Local Development (without Docker)

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your local PostgreSQL credentials
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm start
```

---

## API Endpoints

### Products
| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| GET    | /api/products             | List all products        |
| GET    | /api/products/{id}        | Get single product       |
| POST   | /api/products             | Create product           |
| PUT    | /api/products/{id}        | Update product           |
| DELETE | /api/products/{id}        | Delete product           |
| GET    | /api/products/low-stock   | Get low stock products   |

### Customers
| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| GET    | /api/customers            | List all customers       |
| POST   | /api/customers            | Create customer          |
| PUT    | /api/customers/{id}       | Update customer          |
| DELETE | /api/customers/{id}       | Delete customer          |

### Orders
| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| GET    | /api/orders               | List all orders          |
| POST   | /api/orders               | Create order             |
| PUT    | /api/orders/{id}          | Update order status      |
| DELETE | /api/orders/{id}          | Delete order             |
| GET    | /api/orders/dashboard     | Dashboard stats          |

---

## Submission Links
- GitHub Repository: `<your-github-link>`
- Docker Image: `<your-docker-hub-link>`
- Live Frontend URL: `<your-frontend-url>`
- Live Backend URL: `<your-backend-url>/docs`
