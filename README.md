// Pet Clinic Management System, Devoloping from A1

#########################################################

What you need to install
Prerequisites
- Git
- Node.js LTS (18.x recommended; 20.x OK) + npm
- VS Code (optional but recommended)
- Postman (optional, for API testing)
- MongoDB Atlas access to your cluster
- Make sure their IP is allowed in Atlas → Network Access (or allow 0.0.0.0/0 temporarily for dev).
- They don’t need local MongoDB if using your Atlas URI.

#########################################################

First-time setup (after clone)
# 1) Clone
git clone https://github.com/Chatchai-29/IFN636_A2.git
cd IFN636_A2

# 2) Install root deps (for concurrently scripts)
npm install

# 3) Backend deps
cd backend
npm install

# 4) Frontend deps
cd ../frontend
npm install

#########################################################

Environment files (do NOT commit real secrets)
1) backend/.env ← create this

PORT=5001
NODE_ENV=development

# Use the same Atlas DB the team is using
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<dbname>?retryWrites=true&w=majority

# Must match across environments, but keep it secret
JWT_SECRET=some_super_secret_key

# Allow local React dev server
CORS_ORIGIN=http://localhost:3000

#########################################################

Nice to have (optional)
- nvm / nvm-windows to match Node version easily (18.x)
- PM2 (only for server deploy, not required locally)
- A committed .env.example and frontend/.env.example so teammates know what keys to create.


#########################################################

## Deployment
- **Backend**: `http://Your IP`  
- **Frontend**: `http://Your IP`  

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

