import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    createLeadAccessToken,
    escapeHtml,
    getClientSlug,
    isValidLeadId,
    rateLimit,
    validateLeadPayload,
    verifyLeadAccessToken,
} from './security.js';

describe('escapeHtml', () => {
    it('escapes markup that could be injected into emails', () => {
        assert.equal(
            escapeHtml(`<img src=x onerror="alert('xss')">`),
            '&lt;img src=x onerror=&quot;alert(&#39;xss&#39;)&quot;&gt;'
        );
    });
});

describe('lead access tokens', () => {
    it('accepts a valid token for the matching lead id', () => {
        const token = createLeadAccessToken('lead-123');
        assert.equal(verifyLeadAccessToken(token, 'lead-123'), true);
    });

    it('rejects a token for a different lead id', () => {
        const token = createLeadAccessToken('lead-123');
        assert.equal(verifyLeadAccessToken(token, 'lead-999'), false);
    });

    it('rejects a tampered signature', () => {
        const token = createLeadAccessToken('lead-123');
        const tampered = token.slice(0, -2) + 'aa';
        assert.equal(verifyLeadAccessToken(tampered, 'lead-123'), false);
    });
});

describe('getClientSlug', () => {
    it('uses the subdomain on quotramax.com', () => {
        const req = { headers: { get: (name) => (name === 'host' ? 'demo.quotramax.com' : null) } };
        assert.equal(getClientSlug(req), 'demo');
    });

    it('maps the apex domain to quotramax', () => {
        const req = { headers: { get: (name) => (name === 'host' ? 'www.quotramax.com' : null) } };
        assert.equal(getClientSlug(req), 'quotramax');
    });

    it('maps localhost to local', () => {
        const req = { headers: { get: (name) => (name === 'host' ? 'localhost:8081' : null) } };
        assert.equal(getClientSlug(req), 'local');
    });
});

describe('isValidLeadId', () => {
    it('allows uuid-like ids and rejects traversal', () => {
        assert.equal(isValidLeadId('a1b2c3d4-e5f6-7890-abcd-ef1234567890'), true);
        assert.equal(isValidLeadId('../etc/passwd'), false);
        assert.equal(isValidLeadId(''), false);
    });
});

describe('rateLimit', () => {
    it('blocks a key after the configured number of hits', () => {
        const key = 'test-' + Math.random();
        assert.equal(rateLimit(key, { limit: 2, windowMs: 60_000 }).ok, true);
        assert.equal(rateLimit(key, { limit: 2, windowMs: 60_000 }).ok, true);
        assert.equal(rateLimit(key, { limit: 2, windowMs: 60_000 }).ok, false);
    });
});

describe('validateLeadPayload', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const valid = {
        name: 'Jane Homeowner',
        email: 'jane@example.com',
        phone: '(813) 555-0199',
        address: '100 Bayshore Blvd',
        city: 'Tampa',
        state: 'FL',
        zip: '33602',
        service: 'Full Roof Replacement',
        material: 'Architectural Shingles',
        stories: '1 Story',
        timeline: '1 - 4 weeks',
        insurance: 'Cash / Direct Payment',
        appointment: {
            date: dateStr,
            time: 'Morning Arrival (8:00 AM - 11:00 AM)',
        },
    };

    it('accepts a complete valid payload', () => {
        const result = validateLeadPayload(valid);
        assert.equal(result.error, undefined);
        assert.equal(result.value.email, 'jane@example.com');
        assert.equal(result.value.phone, '8135550199');
        assert.equal(result.value.fullAddress, '100 Bayshore Blvd, Tampa, FL 33602');
    });

    it('flags honeypot submissions without creating a lead', () => {
        const result = validateLeadPayload({ ...valid, website_hp: 'http://spam.test' });
        assert.equal(result.honeypot, true);
    });

    it('rejects missing contact fields', () => {
        const result = validateLeadPayload({ ...valid, email: 'not-an-email' });
        assert.equal(result.error.includes('email'), true);
    });

    it('rejects unknown appointment windows', () => {
        const result = validateLeadPayload({
            ...valid,
            appointment: { date: dateStr, time: 'Whenever' },
        });
        assert.equal(result.error.includes('arrival window'), true);
    });
});
