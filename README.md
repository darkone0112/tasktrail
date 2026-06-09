![logo](tasktrail/public/media/images/imagotype.png)

A quick and easy-to-use note taking app.

## What Runs

TaskTrail has two development servers:

- Express and Prisma API: `http://localhost:3000`
- Webpack frontend dev server: `http://localhost:8080`

Open `http://localhost:8080` while developing. Webpack proxies application and
API requests to Express on port 3000.

## Prerequisites

- Node.js 20 or 22
- MariaDB or MySQL

Alternatively, use Docker and keep Node.js and MariaDB off the host.

## Docker Setup

On Arch Linux, install the missing Compose and Buildx plugins if necessary:

```sh
sudo pacman -S docker-compose docker-buildx
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

Log out and back in after changing group membership. Until then, prefix Docker
commands with `sudo`.

The default Compose setup builds the frontend, starts MariaDB, creates the
database schema, seeds required lookup data, and serves TaskTrail through
Express:

```sh
docker compose up --build
```

Open `http://localhost:3000`.

For hot-reload development, apply the development override:

```sh
docker compose -f compose.yaml -f compose.dev.yaml up --build
```

Open `http://localhost:8080`. Source changes are mounted into the container.

Older Docker installations may provide the standalone `docker-compose` command
instead. Use the same arguments with a hyphen in that case.

The database and uploaded profile images use named volumes and survive
container recreation. To stop the application, run:

```sh
docker compose down
```

To also erase the local container database and uploads:

```sh
docker compose down --volumes
```

For anything beyond local testing, set at least these variables in a root
`.env` file before starting Compose:

```dotenv
TASKTRAIL_DB_PASSWORD=use-a-strong-password
TASKTRAIL_DB_ROOT_PASSWORD=use-another-strong-password
TASKTRAIL_COOKIE_KEYS=use-a-long-random-value
```

## Local Setup

Clone the repository and install the web application dependencies:

```sh
git clone <your-fork-url>
cd tasktrail/tasktrail
npm ci
```

Create a local MariaDB database and user:

```sh
# On a systemd-based Linux distribution
sudo systemctl enable --now mariadb
sudo mariadb
```

Then run:

```sql
CREATE DATABASE tasktrail;
CREATE USER 'tasktrail'@'localhost' IDENTIFIED BY 'change-me';
GRANT ALL PRIVILEGES ON tasktrail.* TO 'tasktrail'@'localhost';
FLUSH PRIVILEGES;
```

Create your environment file:

```sh
cp .env.example .env
```

At minimum, ensure `DATABASE_URL` in `.env` matches the database credentials:

```dotenv
DATABASE_URL="mysql://tasktrail:change-me@localhost:3306/tasktrail"
```

Create the database tables, generate Prisma Client, and seed token types:

```sh
npx prisma db push
npx prisma generate
npx prisma db seed
```

Start development:

```sh
npm run dev
```

Then open `http://localhost:8080`.

`npm run build:dev` remains an alias for `npm run dev`.

## Optional Services

Email verification and password recovery require `MAIL_USER`, `MAIL_PASSWD`,
`MAIL_HOST`, and `SMTP_PORT`.

Google login requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and
`GOOGLE_CALLBACK_URL`. The app starts without these values, but Google login is
disabled.

The optional `prisma/events/deleteExpiredTokens.sql` event periodically removes
expired tokens.

## People
This project was developed by [byeejasonn](https://github.com/byeejasonn), [LDanielCG-Dev](https://github.com/LDanielCG-Dev) and [icutum](https://github.com/icutum), three spanish students of the vocational course of Web Application Development for our final degree work.
