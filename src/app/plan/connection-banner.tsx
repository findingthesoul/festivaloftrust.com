import type { Connection } from "./actions";

/**
 * Says plainly what the planner is talking to. While nothing is connected the
 * honest thing is to show it rather than let a working-looking screen imply a
 * plan is stored somewhere it is not.
 */
export function ConnectionBanner({
  connection,
  hasRun,
}: {
  connection: Connection;
  hasRun: boolean;
}) {
  if (connection.configured && connection.ok) {
    return (
      <aside className="mt-16 border-t border-ink/15 pt-6 text-sm">
        <p>
          <span className="text-green font-medium">Connected to The Fibre</span>{" "}
          <span className="text-ink/60">
            — workspace {connection.workspaceId.slice(0, 8)}…, {connection.scopes.length} scopes.
          {hasRun
            ? " The nine steps come from Flow; changes save to the platform."
            : " No run found for this festival, so the steps below come from this repository."}
          </span>
        </p>
      </aside>
    );
  }

  const detail = connection.configured
    ? `A key is set but the platform refused it: ${connection.error}`
    : "No app key is configured yet, so this plan is saved in this browser only — not shared with your core group, and lost if site data is cleared.";

  return (
    <aside className="mt-16 border-t border-ink/15 pt-6 text-sm">
      <p className="font-medium">Not connected to The Fibre</p>
      <p className="text-ink/70 mt-1 max-w-2xl leading-relaxed text-pretty">{detail}</p>
      <p className="text-ink/50 mt-2 max-w-2xl leading-relaxed text-pretty">
        fot-planner is registered and awaiting review. It then needs approving,
        activating on the workspace, and a key minting — after which the nine
        steps come from Flow rather than from this repository.
      </p>
    </aside>
  );
}
