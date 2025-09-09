// Pet Clinic Management System

A full-stack web application for managing pet clinic operations.  
This project is developed as part of IFN636 – Software Life Cycle Management.

// Features
- Owner and Pet management  
- Appointment scheduling  
- Dashboard with search and validation  
- Backend API with Express.js + MongoDB  
- Frontend with React.js  
- Deployment on AWS EC2 using PM2  
- GitHub Actions CI/CD pipeline  

// Project Structure


## Deployment
- **Backend**: `http://3.107.84.70:5001`  
- **Frontend**: `http://3.107.84.70:3000`  

## CI/CD
- GitHub Actions (build, test, deploy)  
- Auto-deploys to AWS EC2 on push to `main`  
- Managed with **PM2** for process management  

## Run Locally
```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm start

