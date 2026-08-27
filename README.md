# ReflectAI — User-Authenticated Gemini Reflection Journal & Isolated Firestore

ReflectAI is a secure, user-authenticated journaling and reflective AI partner application. It leverages **Gemini 3.6 Flash** for multi-turn empathetic reflection, creative brainstorming, and structured executive synthesis, backed by **Cloud Firestore** with strict owner-bound data isolation security rules and **Firebase Authentication** (Google Sign-In).

---

## 🛡️ Architecture & Threat Model Countermeasures

| Threat Zone | Identified Risk | Countermeasure Implemented |
| :--- | :--- | :--- |
| **Input Surfaces** | Malicious prompt injection, payload tampering | Strict input validation, length bounding, defensive null-safe payload ingestion. |
| **Planning & Reasoning** | System prompt bypass / jailbreaking | Distinct system instructions separating user thoughts as data from system directives. |
| **Tool & Backend Execution** | Unauthorized Gemini API invocation, SSRF | Server-side Gemini API proxy (`/api/gemini/*`) with resilient model fallback ladder (`gemini-3.6-flash` -> `gemini-3.1-flash-lite` -> `gemini-flash-latest` -> `gemini-3.7-flash`). |
| **Memory & State** | Cross-user data leakage in Firestore | Strict owner-bound Firestore security rules (`request.auth.uid == userId`) and undefined-stripped payloads. |
| **Inter-System Secrets** | Exposure of credentials in client bundles | Zero hardcoded secrets; operational credentials managed via Google Cloud Secret Manager / environment variables. |

---

## 🔒 Firestore Security Rules

Deploy the following security rules to guarantee complete user data isolation in Cloud Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Isolated user root document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Isolated user interactions (chats, multi-turn reflections, summaries)
      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // Isolated user entries / journal logs
      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 🔑 Secret Management Setup (Google Cloud Secret Manager)

To securely supply the Gemini API key without embedding secrets into images or source repositories:

```bash
# 1. Create and populate the secret in Google Cloud Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 Google Cloud Run Deployment Flow

### Prerequisites
1. Ensure the Google Cloud SDK (`gcloud`) is installed and authenticated.
2. Enable the required GCP service APIs:
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com
```

### Build & Deploy
Deploy the container directly to Cloud Run with Secret Manager environment injection:

```bash
# Deploy to Google Cloud Run
gcloud run deploy reflectai-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

### Campaign Verification Resource Labeling
Apply the mandatory resource label to register the Cloud Run service for automated challenge verification:

```bash
gcloud run services update reflectai-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Functional Walkthrough & Verification Test Cases

| Test Case | Target Flow | Expected Result |
| :--- | :--- | :--- |
| **TC-01: Authentication** | Click "Sign In with Google" on landing page | Successfully authenticates user, loads private dashboard, shows user avatar and email. |
| **TC-02: User Data Isolation** | User A logs in and saves a reflection; User B logs in | User B cannot view or access User A's reflections due to `/users/{userId}/interactions/*` rules. |
| **TC-03: Multi-turn Reflection** | Type a journal thought, submit with mode "Deep Reflection" | User message renders instantly, Gemini responds with empathetic inquiry, both turns saved to Firestore. |
| **TC-04: AI Mode Switching** | Switch to "Brainstorming" or "Action Steps" mode and send a follow-up | Gemini tailors response to the selected mode while maintaining multi-turn context history. |
| **TC-05: Executive Synthesis** | Click "Generate Summary" in AI Insights panel | Gemini synthesizes full transcript into key themes, introspection score (1-10), and action items. |
| **TC-06: Interactive Action Items** | Check/uncheck an action item in the insights panel | Checklist state updates instantly and persists across browser refreshes. |
| **TC-07: Journal History & Search** | Search by keyword or filter by mood pills | History updates immediately; selecting an entry loads the full transcript. |
| **TC-08: Export Transcript** | Click "Copy Markdown" or "Download .MD" | Exports clean markdown transcript including summary and multi-turn reflections. |
| **TC-09: Resilient AI Fallback** | Backend catches simulated model error / rate limit | Automatically traverses the fallback ladder (`gemini-3.6-flash` -> `gemini-3.1-flash-lite` -> `gemini-flash-latest` -> `gemini-3.7-flash`). |
| **TC-10: Database Error Recovery** | Network disconnection during save | UI displays a clear retry banner with "Retry Save" option; input buffer is never lost. |
