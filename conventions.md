# Initialization Conventions

## Supabase Initialization
Supabase is currently the primary backend service used in this project. It is initialized centralized in `src/lib/supabase.js`:

1. **Environment Variables**: It relies on Vite environment variables for configuration.
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. **Client Creation**: It uses `@supabase/supabase-js` to create the client.
3. **Graceful Fallback**: It exports a boolean `missingSupabaseEnv`. In `src/App.jsx`, if these variables are missing, the app catches this and displays a dedicated UI prompting the user to set up their `.env` file rather than crashing the React tree.
4. **Context Usage**: The `ProfileContext.jsx` relies on `getSupabaseClient()` to fetch user profile information directly from the `profiles` table upon successful session retrieval.

## Firebase Initialization
**Status: Not Found in Codebase**

After a comprehensive scan of the repository (including `package.json`, source files, and `index.html`), there are **no traces** of Firebase being initialized or installed. 

### Points of Failure / Investigation:
1. **Missing Dependencies**: `firebase` is not listed in `package.json`. If you attempted to add Firebase Studio or the Firebase SDK, the installation might have failed or the changes were reverted/not saved.
2. **No Initialization Code**: There is no `firebase.js` or `firebaseConfig.js` file, nor are there any Firebase script tags in `index.html`.
3. **Potential Conflict**: If you were trying to run Supabase and Firebase side-by-side, ensure both sets of environment variables step clear of each other. However, right now the "break" might just be that the Firebase code you attempted to add is completely missing from the current working tree.
4. **Git State**: The working tree is currently clean and on the `main` branch. If you added Firebase on another branch, you may need to switch to that branch.

**Conclusion**:
The current codebase safely initializes Supabase, but any Firebase implementation has either been removed, not committed, or not properly saved to this directory.
