# Oura Mind Journal API – Route Summary



Base URL: `http://localhost:5000/api`

---

Current API routes for Oura Mind Journal:

## Auth Routes

- `POST /auth/register` — Register a new user (name, email, password)
- `POST /auth/login` — Log in and receive JWT cookie
- `POST /auth/logout` — Log out (clears token)

---

## Journal Routes 

- `GET /journal` — Get all journal entries for the current user
- `GET /journal/:id` — View one journal entry (decrypted, with emotions and tools)
- `POST /journal` — Create a new encrypted journal entry + emotion analysis
- `PUT /journal/:id` — Update journal entry and re-analyze emotions
- `DELETE /journal/:id` — Delete a journal entry

---

## Reflection Tool Routes 

- `GET /tools/:path/:entryId` — Get tool info, prompts, mood list
- `POST /tools/:path/:entryId` — Submit reflection answers + mood ratings
- `GET /tools/:path/:entryId/view` — View submitted reflection (read-only)
- `GET /tools/:path/:entryId/edit` — Load existing responses for editing
- `PUT /tools/:path/:entryId` — Update reflection answers + moods
- `DELETE /tools/:path/:entryId` — Delete a reflection submission

---

## Dashboard Routes 

- `GET /dashboard` — Show user dashboard with journal entries
- `GET /dashboard/admin/summary` — Admin-only: basic summary data

---

## Admin Tool Routes 

- `GET /admin/tools` — List all tools with usage count
- `GET /admin/tools/:id` — View one tool
- `POST /admin/tools` — Create new reflection tool
- `PUT /admin/tools/:id` — Update a tool
- `DELETE /admin/tools/:id` — Delete a tool
- `GET /admin/tools/:id/prompts` — Get prompts for a tool
- `GET /admin/tools/:id/emotions` — Get emotions linked to a tool



## Dependencies notes:

- [ibm-watson](https://www.npmjs.com/package/ibm-watson)
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [cors](https://www.npmjs.com/package/cors)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
- [body-parser](https://www.npmjs.com/package/body-parser)
