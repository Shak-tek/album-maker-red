# Simple Auth App

This project provides a minimal Express server with a sign-up and login system using a PostgreSQL database (for example a Neon database hosted on Netlify).

## Development

Install dependencies:

```bash
npm install
```

Set the `DATABASE_URL` environment variable to point to your Neon/PostgreSQL connection string before starting the server. You can create a `.env` file or export it directly:

```bash
export DATABASE_URL="postgres://<user>:<password>@<host>/<db>?sslmode=require"
```

Start the server:

```bash
npm start
```

Then visit <http://localhost:3000> to see the homepage with sign-up and login forms.
