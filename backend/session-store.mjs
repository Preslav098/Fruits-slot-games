import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";

const directory = new URL("./data/", import.meta.url);
const file = new URL("sessions.json", directory);
const temporaryFile = new URL("sessions.tmp", directory);

export function loadSessions() {
  mkdirSync(directory, { recursive: true });

  if (!existsSync(file)) {
    return new Map();
  }

  // Ако файлът е повреден, спираме с грешка.
  // Не нулираме тихомълком балансите.
  const stored = JSON.parse(readFileSync(file, "utf8"));

  return new Map(
    stored.map(([id, session]) => [
      id,
      {
        ...session,
        requests: new Map(session.requests ?? []),
      },
    ]),
  );
}

export function saveSessions(sessions) {
  mkdirSync(directory, { recursive: true });

  const stored = [...sessions.entries()].map(
    ([id, session]) => [
      id,
      {
        ...session,
        requests: [...session.requests.entries()],
      },
    ],
  );

  writeFileSync(
    temporaryFile,
    JSON.stringify(stored),
    {
      encoding: "utf8",
      mode: 0o600,
    },
  );

  renameSync(temporaryFile, file);
}