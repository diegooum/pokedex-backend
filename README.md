# 🧠 Pokédex SaaS API (Backend)

![NestJS](https://img.shields.io/badge/backend-NestJS-red)
![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-blue)
![Deploy](https://img.shields.io/badge/deploy-Render-black)

This is the **RESTful API** that powers the Pokédex SaaS Platform. It handles authentication, team logic, and algorithmic analysis.

🔗 **API Base URL:** `https://pokedex-backend-6zqs.onrender.com`

## 🛠️ Tech Stack (Backend)

* **Framework:** NestJS (Node.js)
* **Language:** TypeScript
* **Database:** PostgreSQL (Hosted on Render)
* **ORM:** Prisma
* **Security:** Passport.js, JWT, BCrypt
* **Architecture:** Modular (Auth, Pokemon, Teams)

## 🚀 API Capabilities

### 🔐 Authentication (`/auth`)
* `POST /register`: Creates a new user with hashed password.
* `POST /login`: Validates credentials and returns a **Bearer Token**.

### 🐉 Pokémon Data (`/pokemon`)
* `GET /search?term=pikachu`: Proxies PokeAPI data with optimized response.
* `GET /:id`: Returns detailed stats, evolution chain, and multilingual descriptions.
* `GET /:id/recommendations`: Uses **Euclidean Distance** to find similar Pokémon (KNN).

### 🏆 Team Management (`/teams`)
* `POST /`: Saves a team of up to 6 Pokémon for the authenticated user.
* `GET /:id/analysis`: **The "Brain" of the SaaS**. Calculates:
    * Team Averages (Radar Chart data).
    * Type Distribution.
    * MVP (Most Valuable Player).
    * Weakness Warnings.

## ⚙️ Local Installation

To run this backend locally:

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/pokedex-backend.git](https://github.com/YOUR_USERNAME/pokedex-backend.git)
    cd pokedex-backend
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Database Setup**
    Ensure you have PostgreSQL running locally or use a cloud URL.
    Create a `.env` file:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/pokedex_db"
    JWT_SECRET="your_super_secret_key"
    ```

4.  **Run Migrations & Start**
    ```bash
    npx prisma migrate dev
    npm run start:dev
    ```

---

## 👨‍💻 Author

**Diego** - *Business Informatics Student*