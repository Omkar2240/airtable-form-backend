# Airtable Form Builder

A full-stack application that allows users to create dynamic forms connected to Airtable bases with conditional logic, real-time webhook synchronization, and response management.

## 🌐 Live Deployment

- **Frontend**: [https://airtable-form-2025.vercel.app/](https://airtable-form-2025.vercel.app/)
- **Backend**: [https://airtable-form-backend-x3s3.onrender.com](https://airtable-form-backend-x3s3.onrender.com)

## 📦 Repositories

- **Frontend**: [https://github.com/Omkar2240/airtable-form-frontend](https://github.com/Omkar2240/airtable-form-frontend)
- **Backend**: [https://github.com/Omkar2240/airtable-form-backend](https://github.com/Omkar2240/airtable-form-backend)

## ✨ Features

- **Airtable OAuth Integration**: Secure authentication with Airtable
- **Dynamic Form Builder**: Create forms by mapping Airtable fields
- **Conditional Logic**: Show/hide questions based on user responses
- **Real-time Webhooks**: Automatic sync with Airtable when records are updated or deleted
- **Response Management**: View and manage form submissions
- **Multi-base Support**: Work with multiple Airtable bases and tables

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16.0.5 (React 19.2.0)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Deployment**: Vercel

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB (Mongoose 9.0.0)
- **Authentication**: Express Session
- **Deployment**: Render

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher) - Install with `npm install -g pnpm`
- **MongoDB** (v4.4 or higher) - Local or cloud instance
- **Airtable Account** with OAuth integration credentials

---

## 🚀 Setup Instructions

### 1. Clone the Repositories

```bash
# Clone the main project
git clone https://github.com/Omkar2240/airtable-form-frontend.git
git clone https://github.com/Omkar2240/airtable-form-backend.git

# Or if you have the monorepo structure
cd Airtable-form-builder
```

### 2. Backend Setup

#### Step 2.1: Install Dependencies

```bash
cd backend
pnpm install
```

#### Step 2.2: Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Airtable OAuth Credentials
AIRTABLE_CLIENT_ID=your_airtable_client_id
AIRTABLE_CLIENT_SECRET=your_airtable_client_secret
AIRTABLE_REDIRECT_URI=http://localhost:3000/oauth/success

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/airtable-form-builder
# Or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/dbname

# Server Configuration
PORT=4000
NODE_ENV=development

# Session Security
SESSION_SECRET=your_random_secret_key_change_in_production

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Webhook Configuration (MUST be HTTPS in production)
WEBHOOK_URL=https://your-backend-url.com/api/webhooks/airtable
# For local development with ngrok: https://abc123.ngrok.io/api/webhooks/airtable
```

> **Important**: The `WEBHOOK_URL` must be a publicly accessible HTTPS URL. For local development, use [ngrok](https://ngrok.com/) or [localtunnel](https://localtunnel.github.io/www/).

#### Step 2.3: Start MongoDB

If using local MongoDB:

```bash
# On Windows (PowerShell)
net start MongoDB

# Or start mongod manually
mongod --dbpath C:\data\db
```

If using MongoDB Atlas, ensure your connection string is correctly set in `MONGO_URI`.

#### Step 2.4: Run the Backend

```bash
# Development mode with hot reload
pnpm dev

# Production mode
pnpm start
```

The backend will be available at `http://localhost:4000`

---

### 3. Frontend Setup

#### Step 3.1: Install Dependencies

```bash
cd frontend
pnpm install
```

#### Step 3.2: Configure Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

For production, use your deployed backend URL:

```env
NEXT_PUBLIC_API_URL=https://airtable-form-backend-x3s3.onrender.com
```

#### Step 3.3: Run the Frontend

```bash
# Development mode
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

The frontend will be available at `http://localhost:3000`

---

## 🔐 Airtable OAuth Setup Guide

To enable Airtable integration, you need to create an OAuth integration in Airtable.

### Step 1: Create an OAuth Integration

1. Go to [Airtable Developer Hub](https://airtable.com/create/oauth)
2. Click **"Create new OAuth integration"**
3. Fill in the integration details:
   - **Name**: Airtable Form Builder
   - **Description**: Dynamic form builder with Airtable integration
   - **Logo**: (optional) Upload your app logo

### Step 2: Configure OAuth Settings

#### Redirect URLs

Add the following redirect URLs based on your environment:

**Development**:
```
http://localhost:3000/oauth/success
```

**Production**:
```
https://airtable-form-2025.vercel.app/oauth/success
```

#### Required Scopes

Select the following scopes for your integration:

- ✅ `data.records:read` - Read records from tables
- ✅ `data.records:write` - Create records from form submissions
- ✅ `schema.bases:read` - List bases and tables
- ✅ `webhook:manage` - Create and manage webhooks

### Step 3: Get Your Credentials

After creating the integration:

1. Copy the **Client ID**
2. Generate and copy the **Client Secret**
3. Add these to your backend `.env` file:

```env
AIRTABLE_CLIENT_ID=your_copied_client_id
AIRTABLE_CLIENT_SECRET=your_copied_client_secret
```

### Step 4: Test the OAuth Flow

1. Start both frontend and backend servers
2. Navigate to `http://localhost:3000`
3. Click **"Login with Airtable"**
4. You'll be redirected to Airtable's authorization page
5. Grant the requested permissions
6. You'll be redirected back to your app at `/oauth/success`

---

## 📊 Data Model Explanation

### Database Schema

The application uses MongoDB with three main collections:

#### 1. User Collection

Stores Airtable user authentication data:

```javascript
{
  _id: ObjectId,
  airtableUserId: String,        // Unique Airtable user ID
  accessToken: String,           // OAuth access token (encrypted)
  refreshToken: String,          // OAuth refresh token (encrypted)
  tokenExpiresAt: Date,         // Token expiration timestamp
  profile: {                    // User profile from Airtable
    id: String,
    email: String,
    name: String
  },
  createdAt: Date
}
```

#### 2. Form Collection

Stores form configuration and field mappings:

```javascript
{
  _id: ObjectId,
  ownerUserId: String,           // Reference to User
  airtableBaseId: String,        // Airtable base ID
  airtableTableId: String,       // Airtable table ID
  webhookId: String,             // Airtable webhook ID for this form
  title: String,                 // Form title
  questions: [                   // Array of form questions
    {
      questionKey: String,       // Unique key (same as airtableFieldId)
      airtableFieldId: String,   // Airtable field ID
      label: String,             // Display label
      type: String,              // Field type (singleLineText, multipleSelects, etc.)
      required: Boolean,         // Is field required?
      options: [String],         // For select fields (dropdown options)
      conditionalRules: {        // Optional conditional logic
        logic: String,           // "AND" or "OR"
        conditions: [
          {
            questionKey: String, // Reference to another question
            operator: String,    // "equals", "notEquals", "contains"
            value: Mixed         // Comparison value
          }
        ]
      }
    }
  ],
  createdAt: Date
}
```

#### 3. Response Collection

Stores form submission data:

```javascript
{
  _id: ObjectId,
  formId: ObjectId,              // Reference to Form
  airtableRecordId: String,      // Corresponding Airtable record ID
  answers: {                     // Key-value pairs of answers
    [questionKey]: Mixed         // Answer value (string, array, etc.)
  },
  status: String,                // "ok" or error status
  deletedInAirtable: Boolean,    // Synced deletion status
  createdAt: Date,
  updatedAt: Date
}
```

### Data Flow

```
User fills form → Frontend validates → Backend creates MongoDB Response
                                    ↓
                              Airtable API creates record
                                    ↓
                         Response.airtableRecordId updated
                                    ↓
               Webhook listens for Airtable changes
                                    ↓
            MongoDB Response updated/marked as deleted
```

---

## 🧮 Conditional Logic Explanation

Conditional logic allows you to show or hide form questions based on previous answers.

### How It Works

Each question can have a `conditionalRules` object that determines its visibility:

```javascript
{
  logic: "AND",  // or "OR"
  conditions: [
    {
      questionKey: "fld123",     // The question to check
      operator: "equals",         // Comparison operator
      value: "Yes"               // Expected value
    }
  ]
}
```

### Supported Operators

| Operator | Description | Example Use Case |
|----------|-------------|------------------|
| `equals` | Exact match (loose equality) | Show question if answer is "Yes" |
| `notEquals` | Not equal to value | Show if answer is NOT "No" |
| `contains` | Value includes (works with arrays and strings) | Show if "Email" is selected in multi-select |

### Logic Types

- **AND**: All conditions must be true to show the question
- **OR**: At least one condition must be true to show the question

### Example: Multi-Level Conditional Form

```javascript
// Question 1: "Are you interested in our services?"
{
  questionKey: "fld1",
  label: "Are you interested in our services?",
  type: "singleSelect",
  options: ["Yes", "No"],
  conditionalRules: null  // Always shown
}

// Question 2: "Which service?" (shown only if Q1 = "Yes")
{
  questionKey: "fld2",
  label: "Which service interests you?",
  type: "multipleSelects",
  options: ["Web Development", "Mobile Apps", "Consulting"],
  conditionalRules: {
    logic: "AND",
    conditions: [
      { questionKey: "fld1", operator: "equals", value: "Yes" }
    ]
  }
}

// Question 3: "Tell us more" (shown if Q2 includes "Web Development")
{
  questionKey: "fld3",
  label: "Tell us about your web project",
  type: "multilineText",
  conditionalRules: {
    logic: "AND",
    conditions: [
      { questionKey: "fld2", operator: "contains", value: "Web Development" }
    ]
  }
}
```

### Frontend Implementation

The frontend evaluates conditions in real-time:

```javascript
// utils/conditional.js
export function evaluateCondition(condition, answersSoFar) {
  const { questionKey, operator, value } = condition;
  const left = answersSoFar[questionKey];

  if (operator === 'equals') return left == value;
  if (operator === 'notEquals') return left != value;
  if (operator === 'contains') {
    if (Array.isArray(left)) return left.includes(value);
    if (typeof left === 'string') return left.includes(value);
    return false;
  }
  return false;
}

export function shouldShowQuestion(rules, answersSoFar) {
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return true;  // No conditions = always show
  }
  
  const results = rules.conditions.map(c => evaluateCondition(c, answersSoFar));
  
  if (rules.logic === 'AND') {
    return results.every(Boolean);  // All must be true
  }
  return results.some(Boolean);     // At least one must be true
}
```

---

## 🔔 Webhook Configuration

Webhooks enable real-time synchronization between Airtable and your application.

### What Are Webhooks?

Webhooks are automatic notifications sent from Airtable to your backend when data changes:

- ✅ Record created
- ✅ Record updated
- ✅ Record deleted

### Setup Requirements

#### 1. HTTPS Endpoint (Required)

Airtable requires webhook URLs to be HTTPS. You have several options:

**Production**: Use your deployed backend URL
```
https://airtable-form-backend-x3s3.onrender.com/api/webhooks/airtable
```

**Local Development**: Use a tunneling service

##### Option A: ngrok (Recommended)

```bash
# Install ngrok
npm install -g ngrok

# Start your backend on port 4000
cd backend
pnpm dev

# In a new terminal, create a tunnel
ngrok http 4000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update your .env:
WEBHOOK_URL=https://abc123.ngrok.io/api/webhooks/airtable
```

##### Option B: localtunnel

```bash
# Install localtunnel
npm install -g localtunnel

# Create tunnel
lt --port 4000 --subdomain myformbuilder

# Update your .env:
WEBHOOK_URL=https://myformbuilder.loca.lt/api/webhooks/airtable
```

#### 2. Configure Environment Variable

Add to your backend `.env`:

```env
WEBHOOK_URL=https://your-public-url.com/api/webhooks/airtable
```

### How Webhooks Work

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│  Airtable   │         │   Backend    │         │   MongoDB    │
│    Base     │         │    Server    │         │   Database   │
└─────────────┘         └──────────────┘         └──────────────┘
       │                        │                        │
       │  1. Form created       │                        │
       │  Register webhook ────>│                        │
       │                        │                        │
       │  2. User edits record  │                        │
       │                        │                        │
       │  3. Webhook fires      │                        │
       │  POST /api/webhooks ───>│                        │
       │                        │                        │
       │                        │  4. Update Response    │
       │                        │ ──────────────────────>│
       │                        │                        │
       │  5. User deletes       │                        │
       │  POST /api/webhooks ───>│                        │
       │                        │                        │
       │                        │  6. Mark as deleted    │
       │                        │ ──────────────────────>│
```

### Webhook Registration

Webhooks are automatically registered when you create a form:

```javascript
// backend/src/services/webhookService.js
export async function registerWebhook(user, baseId) {
  const url = `https://api.airtable.com/v0/bases/${baseId}/webhooks`;
  
  const res = await axios.post(url, {
    notificationUrl: process.env.WEBHOOK_URL,
    specification: {
      options: {
        filters: {
          dataTypes: ["tableData"]  // Listen for record changes
        }
      }
    }
  }, {
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
      "Content-Type": "application/json"
    }
  });
  
  return res.data;  // Returns webhook ID
}
```

### Handling Webhook Events

```javascript
// backend/src/controllers/webhooks.controller.js
export async function handleAirtableWebhook(req, res) {
  const { base, webhook } = req.body;
  
  // Find forms associated with this base
  const forms = await Form.find({ 
    airtableBaseId: base.id,
    webhookId: webhook.id 
  });
  
  // Process each changed record
  for (const form of forms) {
    for (const record of changedRecords) {
      if (record.destroyed) {
        // Mark as deleted in MongoDB
        await Response.updateMany(
          { formId: form._id, airtableRecordId: record.id },
          { deletedInAirtable: true, updatedAt: new Date() }
        );
      } else {
        // Update the response with latest data
        await Response.findOneAndUpdate(
          { formId: form._id, airtableRecordId: record.id },
          { answers: record.fields, updatedAt: new Date() }
        );
      }
    }
  }
}
```

### Webhook Limits

Airtable has limits on webhooks:

- **Per Base**: Maximum number of webhooks per OAuth integration
- **Rate Limits**: Webhook notifications are rate-limited

The application handles the `TOO_MANY_WEBHOOKS_BY_OAUTH_INTEGRATION_IN_BASE` error by attempting to reuse existing webhooks.

---

## 🏃 How to Run the Project

### Development Mode

#### Terminal 1: Backend

```powershell
cd backend
pnpm install
pnpm dev
```

#### Terminal 2: Frontend

```powershell
cd frontend
pnpm install
pnpm dev
```

#### Terminal 3: Webhook Tunnel (Optional for local development)

```powershell
ngrok http 4000
# Update backend/.env with the HTTPS URL
```

### Production Build

#### Backend

```powershell
cd backend
pnpm install
pnpm start
```

#### Frontend

```powershell
cd frontend
pnpm install
pnpm build
pnpm start
```

### Using Docker (Optional)

You can containerize the application using Docker:

```bash
# Backend Dockerfile example
docker build -t airtable-form-backend ./backend
docker run -p 4000:4000 --env-file ./backend/.env airtable-form-backend

# Frontend Dockerfile example
docker build -t airtable-form-frontend ./frontend
docker run -p 3000:3000 airtable-form-frontend
```

---

## 🎯 Usage Flow

### 1. Login

- Navigate to `http://localhost:3000` or the deployed frontend URL
- Click **"Login with Airtable"**
- Authorize the application

### 2. Create a Form

1. Go to **"Form Builder"** (`/builder`)
2. Select an Airtable **Base**
3. Select a **Table** from that base
4. Add fields from the table to your form
5. Configure each field:
   - Set as required or optional
   - Add conditional logic (optional)
6. Click **"Save Form"**

### 3. Share the Form

- Copy the form URL: `https://airtable-form-2025.vercel.app/form/{formId}`
- Share with users to collect responses

### 4. View Responses

1. Go to **"Dashboard"** (`/dashboard`)
2. View all your forms
3. Click on a form to see responses
4. Responses are automatically synced with Airtable

### 5. Sync with Airtable

- Webhooks automatically update responses when:
  - Records are edited in Airtable
  - Records are deleted in Airtable
- Changes are reflected in the responses view

---

## 📸 Screenshots

### 1. Login Page

The landing page with Airtable OAuth login:

![Login Page](https://airtable-form-2025.vercel.app/)

*Features*:
- Clean, modern UI
- One-click Airtable authentication
- Secure OAuth flow

### 2. Form Builder

Build forms by mapping Airtable fields:

![Form Builder - Base Selection](https://airtable-form-2025.vercel.app/builder)

*Features*:
- Select Airtable base and table
- Drag and drop field mapping
- Real-time preview
- Conditional logic configuration

### 3. Form Preview

Public form that users fill out:

![Form Preview](https://airtable-form-2025.vercel.app/form/[formId])

*Features*:
- Responsive design
- Conditional field visibility
- Client-side validation
- Success confirmation

### 4. Dashboard

View all forms and their responses:

![Dashboard](https://airtable-form-2025.vercel.app/dashboard)

*Features*:
- List of all created forms
- Response count
- Quick access to form links
- Form management

### 5. Response Viewer

View individual form responses:

![Response Viewer](https://airtable-form-2025.vercel.app/form/[formId]/responses)

*Features*:
- Table view of all responses
- Airtable sync status
- Export capabilities
- Real-time updates via webhooks

---

## 🎥 Demo Video

[Watch the full demo video](https://drive.google.com/file/d/1RfIwBIKmvyIS5cIXrevj8_d-Ubthh06X/view?usp=sharing)


## 🔧 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/airtable/login` | Initiates OAuth flow |
| GET | `/auth/airtable/callback` | OAuth callback handler |
| GET | `/auth/airtable/bases` | Get user's bases |
| GET | `/auth/airtable/bases/:baseId/tables` | Get tables in a base |
| GET | `/auth/airtable/bases/:baseId/tables/:tableId/fields` | Get fields in a table |

### Forms

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/forms` | Get all forms for user |
| POST | `/api/forms` | Create new form |
| GET | `/api/forms/:formId` | Get form by ID |
| PUT | `/api/forms/:formId` | Update form |
| DELETE | `/api/forms/:formId` | Delete form |
| GET | `/api/forms/:formId/responses` | Get form responses |
| POST | `/api/forms/:formId/submit` | Submit form response |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/airtable` | Airtable webhook handler |

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "WEBHOOK_URL must be an HTTPS URL"

**Problem**: Airtable requires HTTPS for webhooks.

**Solution**: 
- Use ngrok or localtunnel for local development
- Ensure production deployment uses HTTPS
- Update `WEBHOOK_URL` in `.env`

#### 2. OAuth Redirect Mismatch

**Problem**: "Redirect URI mismatch" error during login.

**Solution**:
- Ensure `AIRTABLE_REDIRECT_URI` in backend `.env` matches the redirect URL configured in Airtable OAuth settings
- Both must be exact matches (including http/https, ports, and paths)

#### 3. MongoDB Connection Failed

**Problem**: Cannot connect to MongoDB.

**Solution**:
- Verify MongoDB is running: `mongod --version`
- Check connection string in `MONGO_URI`
- For MongoDB Atlas, ensure IP whitelist includes your IP

#### 4. CORS Errors

**Problem**: Cross-origin request blocked.

**Solution**:
- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check CORS configuration in `backend/src/server.js`
- For production, update CORS origin to your deployed frontend URL

#### 5. Session Not Persisting

**Problem**: User logged out after page refresh.

**Solution**:
- Ensure `SESSION_SECRET` is set in backend `.env`
- Verify cookies are enabled in browser
- Check `secure` cookie setting matches your environment (false for HTTP, true for HTTPS)

---

## 🚀 Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect repository to Vercel
3. Configure environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```
4. Deploy

### Backend (Render)

1. Push your code to GitHub
2. Create new Web Service on Render
3. Configure environment variables (all from `.env`)
4. Set build command: `pnpm install`
5. Set start command: `pnpm start`
6. Deploy

### Environment Variables Checklist

#### Backend (Render)
- ✅ `AIRTABLE_CLIENT_ID`
- ✅ `AIRTABLE_CLIENT_SECRET`
- ✅ `AIRTABLE_REDIRECT_URI` (production URL)
- ✅ `MONGO_URI` (MongoDB Atlas)
- ✅ `PORT` (set by Render automatically)
- ✅ `NODE_ENV=production`
- ✅ `SESSION_SECRET`
- ✅ `FRONTEND_URL` (Vercel URL)
- ✅ `WEBHOOK_URL` (Render service URL + /api/webhooks/airtable)

#### Frontend (Vercel)
- ✅ `NEXT_PUBLIC_API_URL` (Render backend URL)

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Omkar**

- GitHub: [@Omkar2240](https://github.com/Omkar2240)
- Frontend Repo: [airtable-form-frontend](https://github.com/Omkar2240/airtable-form-frontend)
- Backend Repo: [airtable-form-backend](https://github.com/Omkar2240/airtable-form-backend)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📧 Support

If you have any questions or need help, please:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Open an issue on GitHub
3. Contact via email (if provided)

---

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

**Built with ❤️ using Next.js, Express, and Airtable API**
