import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isBookingBlocked, mapClientRow, normalizeFaqs, safeLogoUrl } from './clients.js';
import { withDisplayName } from './email.js';
import { slugFromHost } from './security.js';

describe('slugFromHost', () => {
    it('reads the subdomain, the apex, and localhost', () => {
        assert.equal(slugFromHost('smith.quotramax.com'), 'smith');
        assert.equal(slugFromHost('www.quotramax.com'), 'quotramax');
        assert.equal(slugFromHost('localhost:8081'), 'local');
    });

    it('uses the first host when a proxy sends a list', () => {
        assert.equal(slugFromHost('smith.quotramax.com, vercel.app'), 'smith');
    });

    it('falls back to the first label of a custom domain', () => {
        assert.equal(slugFromHost('quote.smithroofing.com'), 'quote');
    });
});

describe('safeLogoUrl', () => {
    it('keeps http(s) urls and drops anything else', () => {
        assert.equal(safeLogoUrl('https://cdn.example.com/logo.png'), 'https://cdn.example.com/logo.png');
        assert.equal(safeLogoUrl('javascript:alert(1)'), '');
        assert.equal(safeLogoUrl('data:image/svg+xml;base64,AAAA'), '');
        assert.equal(safeLogoUrl(''), '');
    });
});

describe('normalizeFaqs', () => {
    it('accepts both key styles and skips incomplete entries', () => {
        const faqs = normalizeFaqs([
            { q: 'Is it free?', a: 'Yes.' },
            { question: 'How long?', answer: 'About 45 minutes.' },
            { q: 'No answer' },
        ]);
        assert.deepEqual(faqs, [
            { q: 'Is it free?', a: 'Yes.' },
            { q: 'How long?', a: 'About 45 minutes.' },
        ]);
    });

    it('parses a json string column and ignores junk', () => {
        assert.deepEqual(normalizeFaqs('[{"q":"Cost?","a":"Free."}]'), [{ q: 'Cost?', a: 'Free.' }]);
        assert.deepEqual(normalizeFaqs('not json'), []);
        assert.deepEqual(normalizeFaqs(null), []);
    });

    it('caps the list so one row cannot flood the page', () => {
        const many = Array.from({ length: 20 }, (_, i) => ({ q: `q${i}`, a: `a${i}` }));
        assert.equal(normalizeFaqs(many).length, 8);
    });
});

describe('mapClientRow', () => {
    it('maps a row and treats a missing active flag as active', () => {
        const config = mapClientRow({
            slug: 'smith',
            company_name: 'Smith Roofing',
            contractor_email: 'office@smithroofing.com',
            logo_url: 'https://smithroofing.com/logo.png',
            faqs: [{ q: 'Free?', a: 'Yes.' }],
        });
        assert.equal(config.companyName, 'Smith Roofing');
        assert.equal(config.contractorEmail, 'office@smithroofing.com');
        assert.equal(config.logoUrl, 'https://smithroofing.com/logo.png');
        assert.equal(config.active, true);
    });

    it('returns null when there is no row', () => {
        assert.equal(mapClientRow(null), null);
    });
});

describe('isBookingBlocked', () => {
    it('blocks a churned client and allows an active one', () => {
        assert.equal(isBookingBlocked({ active: false }), true);
        assert.equal(isBookingBlocked({ active: true }), false);
    });

    it('allows unknown slugs until REQUIRE_KNOWN_CLIENT is set', () => {
        const prev = process.env.REQUIRE_KNOWN_CLIENT;
        try {
            delete process.env.REQUIRE_KNOWN_CLIENT;
            assert.equal(isBookingBlocked(null), false);
            process.env.REQUIRE_KNOWN_CLIENT = 'true';
            assert.equal(isBookingBlocked(null), true);
        } finally {
            if (prev === undefined) delete process.env.REQUIRE_KNOWN_CLIENT;
            else process.env.REQUIRE_KNOWN_CLIENT = prev;
        }
    });
});

describe('withDisplayName', () => {
    it('swaps the display name but keeps the sending address', () => {
        assert.equal(
            withDisplayName('Quotramax Inspections <inspections@quotramax.com>', 'Smith Roofing'),
            'Smith Roofing <inspections@quotramax.com>'
        );
    });

    it('strips header-injection characters', () => {
        assert.equal(
            withDisplayName('Quotramax Inspections <inspections@quotramax.com>', 'Evil\r\nBcc: a@b.com'),
            'Evil Bcc: a@b.com <inspections@quotramax.com>'
        );
    });

    it('leaves the address alone when there is no company name', () => {
        assert.equal(
            withDisplayName('Quotramax Inspections <inspections@quotramax.com>', ''),
            'Quotramax Inspections <inspections@quotramax.com>'
        );
    });
});
