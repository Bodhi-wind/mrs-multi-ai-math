# Security Policy

## Supported use

This project is a **mathematical research** workbench. It must not be used to develop or assist cyber attacks, malware, unauthorized access, fraud, or other illegal activity.

## Reporting

If you discover a vulnerability in the software itself (e.g. path traversal, unsafe eval), open a GitHub issue without attaching exploit weaponization details beyond what's needed to reproduce a fix.

## Secrets

- Never commit API keys. Use `backend/.env` (gitignored).
- Rotate any key that was accidentally exposed in chat or logs.

## Agent / LLM

Prompts and API gates attempt to refuse clearly harmful requests; this is not a guarantee. Operators remain responsible for deployment and key custody.
