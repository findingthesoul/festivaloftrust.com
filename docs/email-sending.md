# Sending sign-in emails

Supabase's built-in sender is development-only: a handful of messages per hour,
and the cap cannot be raised. Sign-in is the front door, so it needs a real
sender before more than one person uses the site.

Resend, since it is already in use elsewhere.

## 1. Add the domain in Resend

Resend → Domains → Add Domain → `festivaloftrust.com`.

It will show three records to create. Resend sends from a **subdomain**
(`send.festivaloftrust.com`) by default, which matters here — see the note on
SPF below.

| Type | Name | Value |
|---|---|---|
| MX | `send` | `feedback-smtp.<region>.amazonses.com` (priority 10) |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |
| TXT | `resend._domainkey` | the DKIM key Resend generates |

Copy the values from Resend's own screen — the DKIM key is unique per domain
and the region differs per account. The table above is the shape, not the
content.

## 2. Add them at TransIP

Control panel → Domein → festivaloftrust.com → DNS instellingen. Same place as
the Vercel records.

**Leave the existing root SPF alone.** The domain currently has:

```
festivaloftrust.com.   TXT   "v=spf1 ~all"
```

which authorises nobody to send as the root domain. That is fine and should
stay: Resend's envelope sender is `send.festivaloftrust.com`, so SPF is checked
against the subdomain record, and DMARC alignment comes from the DKIM key —
which sits on the root. Adding a second root SPF record would break SPF
entirely; a domain may only have one.

## 3. Verify in Resend

DNS at TransIP is usually minutes. Resend re-checks on demand.

## 4. API key

Resend → API Keys → create one with **sending** permission only. It is the SMTP
password below, so it does not need any more than that.

## 5. Point Supabase at it

`festivaloftrust` project → Authentication → Emails → SMTP Settings:

| Field | Value |
|---|---|
| Sender email | `hello@festivaloftrust.com` |
| Sender name | Festival of Trust |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | the Resend API key |

Then Authentication → Rate Limits → raise the emails-per-hour figure. It is
pinned low for the built-in sender and stays low until told otherwise, so this
step is easy to skip and then wonder why the cap is still there.

## The thing this does not fix

`hello@festivaloftrust.com` can **send** after this. It still cannot **receive**:

```
festivaloftrust.com.   MX   10 festivaloftrust.com.
```

That is TransIP's placeholder, pointing the domain at itself. Nothing accepts
mail there, so a reply to a sign-in email bounces — and the email invites one
("just reply or write to hello@festivaloftrust.com").

Fix with email forwarding at TransIP: `hello@festivaloftrust.com` →
a real inbox. Until then either set that up, or stop inviting replies.
