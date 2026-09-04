let pendingConfirmation = null;

export function savePendingConfirmation(confirmation) {
    pendingConfirmation = confirmation;

    try {
        sessionStorage.setItem(`qm_lead_${confirmation.id}`, JSON.stringify(confirmation));
    } catch {
        // The in-memory handoff still makes client-side navigation instant.
    }
}

export function readPendingConfirmation(id) {
    if (pendingConfirmation && String(pendingConfirmation.id) === String(id)) {
        return pendingConfirmation;
    }
    return null;
}
