import { requireLeadAccess } from '@/lib/security';

export { requireLeadAccess };

export function hasLeadAccess(req, leadId) {
    return requireLeadAccess(req, leadId);
}
