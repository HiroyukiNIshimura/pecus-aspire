# Redis token store — keys and operations

This document explains the Redis keys and data structures used for refresh tokens and token blacklisting in this project.

Goal
- Provide a clear mapping of keys, types, TTLs and sample Redis commands so operators and integrators can inspect, troubleshoot, and manage token state.

Principles
- Refresh tokens and blacklist entries are stored in Redis so multiple API instances can share token state.
- Keys use a clear prefix to avoid collisions: `refresh:`, `refresh_user:`, `blacklist:`, `user_jtis:`.
- TTLs are applied to keys so stale tokens are auto-removed.

Keys and types

1) Refresh token entry
- Key: `refresh:{token}`
- Type: string (JSON payload)
- Value: JSON-serialized object: { "Token": "<token>", "UserId": <userId>, "ExpiresAt": "<UTC ISO datetime>" }
- TTL: token expiration time (e.g. 30 days)
- Usage: lookup to validate token and obtain owner

Example commands:

```text
# read
GET refresh:012345abcdef
# delete (revoke)
DEL refresh:012345abcdef
# inspect TTL
TTL refresh:012345abcdef
```

2) Per-user refresh token set
- Key: `refresh_user:{userId}`
- Type: set
- Members: token strings
- TTL: long (e.g. 31 days) — updated on write
- Usage: list all refresh tokens issued to a user (for bulk revoke)

Example commands:

```text
# list
SMEMBERS refresh_user:42
# remove a token from the set
SREM refresh_user:42 012345abcdef
# revoke all: iterate SMEMBERS and DEL refresh:{token} for each, then DEL refresh_user:42
```

3) Token blacklist entry (JTI)
- Key: `blacklist:{jti}`
- Type: string (value is constant marker, e.g. "1")
- TTL: until the JWT expiration time (or a safe default)
- Usage: presence means the JTI is revoked and should be rejected on token validation.

Example commands:

```text
# add to blacklist (expire after e.g. 1 hour)
SETEX blacklist:abcd-jti-0001 3600 1
# check
EXISTS blacklist:abcd-jti-0001
# remove (rarely needed)
DEL blacklist:abcd-jti-0001
```

4) Per-user JTI list (tracking issued JTI values)
- Key: `user_jtis:{userId}`
- Type: set
- Members: jti strings
- TTL: long (e.g. 31 days)
- Usage: keep track of active JTIs for a user to implement bulk invalidation (e.g. revoke all except current)

Example commands:

```text
# add new jti
SADD user_jtis:42 abcd-jti-0001
# list
SMEMBERS user_jtis:42
# blacklist all
for jti in $(redis-cli SMEMBERS user_jtis:42); do redis-cli SETEX blacklist:$jti 2592000 1; done
```

Operational notes

- Expiration alignment: When issuing an access token and a refresh token together, set the blacklist TTL or refresh payload TTL aligned with the token's expiration time.
- Atomicity: Some operations (revoke + remove from set) may require multi-key operations. Use Lua scripts for atomic bulk revoke when necessary.
- Scalability: Sets may grow; consider trimming or using sorted sets with timestamps if you need to expire older items programmatically.
- Security: Treat Redis as sensitive — use ACLs and network restrictions. Do not expose keys or raw tokens in logs.

Troubleshooting

- "Users report they cannot use valid tokens" — check `blacklist:{jti}` existence and `user_jtis:{userId}` operations.
- "Cannot refresh token" — ensure `refresh:{token}` exists and TTL not expired, check `refresh_user:{userId}` membership.

Migration notes

- If you move from local-memory cache to Redis, ensure all running instances are restarted so they use the shared store.
- Backups: store snapshots of Redis RDB or AOF as part of disaster recovery.

Contact
- Developers: refer to the `RefreshTokenService` and `TokenBlacklistService` implementations in `pecus.WebApi/Services` for exact behavior.
