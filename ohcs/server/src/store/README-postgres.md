# Swapping in Postgres (or any real datastore)

`memoryStore.js` is the default so the server runs with zero setup. To persist for real,
implement the same `Store` interface against your database. The interface is small:

```
upsertAccount(sub, handle)   getAccount(sub)   deleteAccount(sub)   exportAccount(sub)
addScore({handle,score,sub}) topScores(n)
addWork(work)                recentWorks(n)    corpusSize()
```

## The one schema rule that protects the whole privacy posture

The works corpus must **not be joinable** to the accounts table. There is no `account_id`
column on `works`. This is what keeps the corpus *anonymous and out of scope* while accounts
carry the full GDPR/CCPA weight. Enforce it in the schema, not in a policy document.

```sql
-- PERSONAL DATA (full data-subject rights: export, erase)
CREATE TABLE accounts (
  sub         TEXT PRIMARY KEY,        -- opaque Google subject id; never email/name unless a feature needs it
  handle      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- PERSONAL DATA (self-chosen handle on a public board; deleted with the account)
CREATE TABLE leaderboard (
  id      BIGSERIAL PRIMARY KEY,
  sub     TEXT REFERENCES accounts(sub) ON DELETE CASCADE,  -- nullable for guests
  handle  TEXT NOT NULL,
  score   INTEGER NOT NULL,
  date    DATE NOT NULL DEFAULT current_date
);

-- ANONYMOUS, OUT OF SCOPE, KEPT FOREVER.  *** NO account_id. EVER. ***
CREATE TABLE works (
  id            TEXT PRIMARY KEY,
  piece         TEXT,        -- the painted clue (description or image ref)
  secret        TEXT,        -- what it was
  sublime_name  TEXT,        -- the crowned human name
  caught        BOOLEAN,     -- did a human flag the machine that round
  date          DATE NOT NULL DEFAULT current_date
  -- intentionally NO foreign key to accounts. The wall is the schema.
);
```

Erasure of an account cascades the leaderboard rows and removes the person. The corpus is
untouched **because it was never linked** — which is exactly why it can be kept.
