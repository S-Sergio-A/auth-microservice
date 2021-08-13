# Authentication service (NestJS)

This service is responsible for handling actions with users.

---

## Responsibilities

- Register user
- Login user
- Logout user
- Verify registration
- Reset password
- Verify password reset
- Change email
- Change username
- Change phone number
- Change password
- Verify data update
- Change optional data
- Refresh session
- Handle contact form
- Generate client access token

---

## Installing App

1. Clone this repository `git clone https://github.com/S-Sergio-A/auth-microservice.git`
2. Navigate to the root directory and add the`.env` file with your database and microservice data:
```
MONGO_USERNAME
MONGO_PASSWORD
MONGO_CLUSTER_URL
MONGO_DATABASE_NAME

JWT_SECRET
CLIENTS_JWT_SECRET
JWT_REFRESH_SECRET
JWT_EXPIRATION_TIME
JWT_REFRESH_EXPIRATION_TIME
JWT_EXPIRATION_TIME_LONG

MAX_REFRESH_SESSIONS_COUNT
   
REDIS_DB_NAME
REDIS_PASSWORD
REDIS_ENDPOINT
REDIS_PORT

MAXIMUM_PASSWORD_VALIDATIONS
HOURS_TO_VERIFY
HOURS_TO_BLOCK
LOGIN_ATTEMPTS_TO_BLOCK
      
CLOUDINARY_API_KEY
CLOUDINARY_CLOUD
CLOUDINARY_API_SECRET
```
3. Install dependencies

```javascript
npm install
```

---

### Running the server in development mode

```javascript
npm start:dev
```

### Running the server in production mode

```javascript
npm build

npm start:prod
```

# License

---

This project uses the following [license](https://github.com/S-Sergio-A/auth-microservice/blob/master/LICENSE).
