# kolioaris.xyz linking

This is the repository of the https://link.kolioaris.xyz website.

## Why is this useful?

This gives the `Contributor` role once someone has contributed in one of my (@kolioaris) repositories. You can use it to give a specific role in your Discord server when someone has contributed in your repositories.

## How to set this up yourself
### Create a KV Worker
This will be used to save linked users and to give the user the Contributor role even after linking.

**Name:** `SESSIONS`

> [!IMPORTANT]
> Make sure you copy the worker's ID for later.

### Create a worker
Go to [Cloudflare's Dashboard](https://dash.cloudflare.com) and create a new worker. You can do that in `Compute > Workers & Pages`.

**Name:** Whatever you want. I named it `link`.

### Create the linking webiste
Fork this GitHub repository and name it however you want.

This tutorial shows you how to publish the website using [Vercel](https://vercel.com). If you use another host.

First, you need to **create a new project** in Vercel. Then, **import** the forked GitHub repository *(you must have your GitHub account linked to Vercel)*. Then, press **Deploy**. This might take a moment, so wait. After that, copy the website's domain. You will need it for later.

### Get the code for the worker
> [!IMPORTANT]
> Make sure you have node.js installed on your computer. You can install it from [here](https://nodejs.org/en/download).

Create a new folder in your computer. Name it whatever you want and create this structure:
```
link/
├─ src/
│  ├─ index.js
├─ package.json
├─ wrangler.toml
```
After that, add this code to `package.json`:
```json
{
  "name": "link",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "devDependencies": {
    "wrangler": "^4.78.0"
  }
}
```

Add this code to wrangler.toml:
```toml
name = ""
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = ""
id = ""

[[routes]]
pattern = "link-api.kolioaris.xyz/*"
zone_name = "kolioaris.xyz"

[triggers]
crons = ["*/30 * * * *"]
```
> [!IMPORTANT]
> In `name`, put the worker's name. In `binding`, put the KV Worker's name. In `id` put the KV Worker's ID. In pattern, put the worker's domain *(located in `Settings > Domains and Routes`)* followed by `/*`. In `zone_name`, put the worker's domain *(without `/*`)*.

Add this code to `src/index.js`:
```js
const DISCORD_GUILD_ID = "";
const DISCORD_ROLE_ID = "";
const API_BASE = "";
const SITE_BASE = "";
const GITHUB_OWNER = "";

function randomState() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function htmlResponse(html) {
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

function errorPage(message) {
  return htmlResponse(`
    <!DOCTYPE html>
    <html>
      <head><title>Error</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:60px;">
        <h2>❌ Something went wrong</h2>
        <p>${message}</p>
        <a href="${SITE_BASE}">Try again</a>
      </body>
    </html>
  `);
}

async function isContributor(githubUsername, githubToken) {
  const headers = {
    Authorization: `Bearer ${githubToken}`,
    "User-Agent": "contributor-linker",
    Accept: "application/vnd.github+json",
  };

  const reposRes = await fetch(
    `https://api.github.com/users/${GITHUB_OWNER}/repos?type=public&per_page=100`,
    { headers },
  );

  if (!reposRes.ok) return false;
  const repos = await reposRes.json();

  for (const repo of repos) {
    if (repo.fork) continue;

    let page = 1;
    while (true) {
      const contribRes = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${repo.name}/contributors?per_page=100&page=${page}`,
        { headers },
      );

      if (!contribRes.ok) break;

      const contributors = await contribRes.json();
      if (!Array.isArray(contributors) || contributors.length === 0) break;

      const found = contributors.some(
        (c) => c.login.toLowerCase() === githubUsername.toLowerCase(),
      );
      if (found) return true;

      if (contributors.length < 100) break;
      page++;
    }
  }

  return false;
}

async function runPeriodicCheck(env) {
  const list = await env.SESSIONS.list({ prefix: "linked:" });

  for (const key of list.keys) {
    const raw = await env.SESSIONS.get(key.name);
    if (!raw) continue;

    let user;
    try {
      user = JSON.parse(raw);
    } catch {
      continue;
    }

    const { discord_id, github_login, github_token } = user;
    if (!discord_id || !github_login || !github_token) continue;

    const contributed = await isContributor(github_login, github_token);

    if (contributed) {
      await fetch(
        `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discord_id}/roles/${DISCORD_ROLE_ID}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
            "Content-Length": "0",
          },
        },
      );
    } else {
      await fetch(
        `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discord_id}/roles/${DISCORD_ROLE_ID}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
          },
        },
      );
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/auth/discord") return handleDiscordAuth(env);
    if (url.pathname === "/auth/discord/callback")
      return handleDiscordCallback(request, env);
    if (url.pathname === "/auth/github") return handleGithubAuth(request, env);
    if (url.pathname === "/auth/github/callback")
      return handleGithubCallback(request, env);

    return new Response("Not found", { status: 404 });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runPeriodicCheck(env));
  },
};

function handleDiscordAuth(env) {
  const state = randomState();
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: `${API_BASE}/auth/discord/callback`,
    response_type: "code",
    scope: "identify guilds.members.read",
    state,
  });
  return Response.redirect(
    `https://discord.com/oauth2/authorize?${params}`,
    302,
  );
}

async function handleDiscordCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return errorPage("No code returned from Discord.");

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${API_BASE}/auth/discord/callback`,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token)
    return errorPage("Failed to get Discord access token.");

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const user = await userRes.json();
  if (!user.id) return errorPage("Failed to get Discord user.");

  const memberRes = await fetch(
    `https://discord.com/api/users/@me/guilds/${DISCORD_GUILD_ID}/member`,
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
  );

  if (memberRes.status !== 200) {
    return errorPage("You must be a member of the Discord server to continue.");
  }

  const sessionId = randomState();
  await env.SESSIONS.put(
    sessionId,
    JSON.stringify({ discord_id: user.id, discord_username: user.username }),
    { expirationTtl: 600 },
  );

  return Response.redirect(`${API_BASE}/auth/github?session=${sessionId}`, 302);
}

function handleGithubAuth(request, env) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session");
  if (!sessionId) return errorPage("Missing session. Please start over.");

  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${API_BASE}/auth/github/callback`,
    scope: "read:user",
    state: sessionId,
  });
  return Response.redirect(
    `https://github.com/login/oauth/authorize?${params}`,
    302,
  );
}

async function handleGithubCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const sessionId = url.searchParams.get("state");

  if (!code || !sessionId) return errorPage("Invalid callback from GitHub.");

  const sessionRaw = await env.SESSIONS.get(sessionId);
  if (!sessionRaw) return errorPage("Session expired. Please start over.");
  const session = JSON.parse(sessionRaw);

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${API_BASE}/auth/github/callback`,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token)
    return errorPage("Failed to get GitHub access token.");

  const githubUserRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "User-Agent": "contributor-linker",
    },
  });
  const githubUser = await githubUserRes.json();
  if (!githubUser.login) return errorPage("Failed to get GitHub user.");

  const contributed = await isContributor(
    githubUser.login,
    tokenData.access_token,
  );

  await env.SESSIONS.put(
    `linked:${session.discord_id}`,
    JSON.stringify({
      discord_id: session.discord_id,
      discord_username: session.discord_username,
      github_login: githubUser.login,
      github_token: tokenData.access_token,
    }),
  );

  if (contributed) {
    const roleRes = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${session.discord_id}/roles/${DISCORD_ROLE_ID}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
          "Content-Length": "0",
        },
      },
    );

    if (roleRes.status !== 204) {
      const err = await roleRes.text();
      return errorPage(`Failed to assign Discord role: ${err}`);
    }
  }

  await env.SESSIONS.delete(sessionId);

  return Response.redirect(
    `${SITE_BASE}/success?discord=${encodeURIComponent(session.discord_username)}&github=${encodeURIComponent(githubUser.login)}&contributor=${contributed}`,
    302,
  );
}
```

> [!IMPORTANT]
> Fill `DISCORD_GUILD_ID` with your Discord's Server ID. Fill `DISCORD_ROLE_ID` with the role ID you want to give to the user who links their account. Fill `API_BASE` with the worker's link. Fill `SITE_BASE` with the website's link *(that you made earlier)*. Fill `GITHUB_OWNER` with your GitHub name.

### Deploy the worker
Open a terminal and write
`npm install -g wrangler`. Once wrangler is installed, write `wrangler login` in your terminal. You need to login to your Cloudflare account. After that, type `wrangler deploy`. Now, you are done!

## Report Issues
If you want to report an error/issue, create a new issue in this repository.