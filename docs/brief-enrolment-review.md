# Brief — enrolment review through the app key

What festivaloftrust.com needs from The Fibre to let organisers review
visitor applications on the site, rather than in The Thread.

## The product intent

A festival with "people apply, and we admit them" switched on receives
applications, not enrolments. The organiser should handle them where they
already watch the guest list: the site's Registrations page —

- the account menu shows **Review** with a number: how many applications
  wait across the organiser's own festivals (admins already have this item
  for pending organisers and submitted festivals; organisers get it only
  for their own visitors);
- each waiting row in the guest book gets **Admit** and **Decline**.

## What the app key can and cannot do today

`GET /apps/:slug/thread/threads/:id/enrolments` answers
`id, enrolment_id, person_id, payment_status, created_at` — deliberately
thin (the data wall), but it omits the one operational fact the organiser
needs: whether the enrolment is still waiting for approval.

Approve and decline exist only as The Thread's own signed-in routes
(`POST /enrolments/:id/approve`, `POST /enrolments/:id/decline`); there is
no app-scoped equivalent.

## The ask

1. Add the enrolment's approval status to the app-key enrolments list —
   one more column in the permitted select, no personal data involved.
2. Expose approve and decline to app keys, behind a scope
   (`review:enrolments` or similar), constrained to threads the workspace
   owns — the same wall as everything else, with one gate in it.

## What the site does the moment this lands

Wire the status into the guest book rows, add the two buttons, badge the
organiser's Review menu item with the count of waiting applications on
their festivals. Site-side work is small and already scoped; nothing else
moves.

## Related, same shape

The public agenda is also waiting on a platform door (reading a thread's
agenda items through the app key) before it can move from the site's own
table into The Thread. If items grow a per-item "public" flag and an
app-key read, the site migrates its agenda over — see the note in
`supabase/migrations/0012_public_agenda.sql`.
