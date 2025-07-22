# LMS System with Multi-Tenant Architecture

A Learning Management System backend with multi-tenant architecture using Node.js, Express, and MongoDB.

## Features

- Multi-tenant architecture with separate databases for each tenant
- JWT authentication with role-based access control
- Course management
- Assignment and quiz functionality
- User progress tracking
- Certification system
- Institution management

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs for password hashing

## Project Structure

```
LMS-system/
├── package.json
├── server.js
├── .env
└── src/
    ├── config/
    │   └── db.js
    ├── controllers/
    │   ├── authController.js
    │   ├── courseController.js
    │   ├── tenantController.js
    │   └── ...
    ├── middleware/
    │   ├── authMiddleware.js
    │   ├── tenantMiddleware.js
    │   └── ...
    ├── models/
    │   ├── User.js
    │   ├── Course.js
    │   ├── Assignment.js
    │   ├── Quiz.js
    │   ├── Tenant.js
    │   └── ...
    ├── routes/
    │   ├── auth.js
    │   ├── courses.js
    │   ├── tenants.js
    │   └── ...
    └── utils/
        ├── tenantUtils.js
        └── ...
```

## Getting Started

### Prerequisites

- Node.js (14.x or higher)
- MongoDB account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/LMS-system.git
cd LMS-system
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
Create a `.env` file in the root directory and add:
```
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
```

4. Start the server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Multi-Tenant Architecture

This LMS system uses a multi-tenant architecture with separate MongoDB databases for each tenant. The system works as follows:

1. Each tenant (organization) has its own database with the same schema structure
2. Tenant identification is handled through:
   - Subdomain (e.g., tenant1.example.com)
   - Custom HTTP header (X-Tenant-ID)
   - JWT token tenant claim
3. Connection pooling is used to maintain connections to multiple tenant databases
4. Data isolation is maintained at the database level

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updateprofile` - Update user profile
- `PUT /api/auth/updatepassword` - Update password

### Tenants
- `GET /api/tenants` - Get all tenants (super admin only)
- `POST /api/tenants` - Create new tenant (super admin only)
- `GET /api/tenants/:id` - Get single tenant (super admin only)
- `PUT /api/tenants/:id` - Update tenant (super admin only)
- `DELETE /api/tenants/:id` - Delete tenant (super admin only)
- `GET /api/tenants/current` - Get current tenant

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create new course (instructor/admin only)
- `GET /api/courses/:id` - Get single course
- `PUT /api/courses/:id` - Update course (instructor/admin only)
- `DELETE /api/courses/:id` - Delete course (instructor/admin only)

## License

This project is licensed under the MIT License. 