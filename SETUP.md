# Setting up Crimson Vault online with Supabase

Time: about 10 minutes. Cost: free (Supabase and Netlify free tiers).

## 1. Create the project
1. Go to https://supabase.com, sign in, click **New project**.
2. Pick any name and a database password (save it), choose the closest region, click **Create**. Wait a minute for it to finish.

## 2. Turn off email confirmation (important)
Players sign up with a username, and the site turns it into a fake email (`name@crimsonvault.game`), so no real email is ever sent.
1. Left menu: **Authentication** -> **Sign In / Providers** (older dashboards: **Providers**) -> **Email**.
2. Switch **Confirm email** OFF and click **Save**.

## 3. Create the tables
1. Left menu: **SQL Editor** -> **New query**.
2. Open `schema.sql` from this folder, copy everything, paste it in, click **Run**. It should say "Success".

## 4. Connect the site
1. Left menu: **Project Settings** -> **API** (or **Data API / API Keys**).
2. Copy the **Project URL** and the **anon / public key**.
3. Open `supabase-config.js` and replace its contents with:
```js
window.SUPABASE_CONFIG = {
  url: "https://YOUR-PROJECT.supabase.co",
  anonKey: "YOUR-ANON-KEY"
};
```
The anon key is meant to be public. Never put the `service_role` key here.

## 5. Put the site online
Easiest: https://app.netlify.com/drop - drag the whole site folder (the one containing `index.html`) onto the page. You get a public link to share.
(GitHub Pages, Vercel and Cloudflare Pages also work: it is a plain static site.)

## 6. Make yourself an admin
1. Open your site and **sign up** with your username and a password (6+ characters).
2. In Supabase: **SQL Editor** -> new query, replace `yourname` with your username in lowercase (spaces become `_`), and run:
```sql
insert into admins (id)
select id from auth.users where email = 'yourname@crimsonvault.game';
```
3. Reload the site. The **Admin** tab is now visible to you only, and it opens straight away with no code. Everyone else cannot see or open it.

Non-admins never see the Admin tab, and the database refuses events, custom cards or gifts from anyone not in the `admins` table.

## What now works for everyone
- Accounts and progress saved online, usable from any device.
- Events (cat memes, disco, quake, Hacker pack in the shop...) start and stop for **every player at the same moment**.
- Gift actions (free pack, coin shower, Admin card, Hacker pack for everyone) reach every player, including people who were offline (they get it when they next log in).
- Global leaderboard.
- Custom cards, custom packs and settings made by admins are shared with everyone.
- Admin Players tab: give or take coins, packs and cards, or reset a player. To delete an account, use **Authentication -> Users** in Supabase.

## Honest limits
- The game runs in the browser, so a technical player could edit their own coins or cards through the API. Fine for a friends game; for a competitive public game the rules (opening packs, selling) would need to move into database functions.
- Admin access is decided by the `admins` table in the database. In local demo mode (no Supabase) there are no accounts to check, so the 0355 code still guards the panel there.
- Free Supabase projects pause after a week with no activity (one click to resume). Free limits are plenty for a few hundred players.
