import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateEstimate } from '@/lib/estimate';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

const LEADS_FILE = path.join(process.cwd(), 'vanilla_backup/data/leads.json');

async function findLeadById(id) {
    if (supabase) {
        try {
            const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
            if (!error && data) {
                return data;
            }
        } catch (e) {
            console.error('Supabase fetch lead by ID for PDF error:', e);
        }
    }

    // Try local filesystem fallback
    try {
        if (fs.existsSync(LEADS_FILE)) {
            const fileData = fs.readFileSync(LEADS_FILE, 'utf8');
            const leads = JSON.parse(fileData);
            const lead = leads.find(l => l.id === id);
            if (lead) return lead;
        }
    } catch (e) {
        console.error('File fallback read lead by ID for PDF error:', e);
    }

    return null;
}

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const lead = await findLeadById(id);

        if (!lead) {
            return new Response('Estimate not found', { status: 404 });
        }

        // Parse serialized wizard fields from motivation if present
        let extraData = {};
        try {
            if (lead.motivation && lead.motivation.startsWith('{')) {
                extraData = JSON.parse(lead.motivation);
            }
        } catch (e) {}

        const stories = lead.stories || '1';
        const condition = lead.age || 'Good';
        const material = lead.material || 'Asphalt shingles';
        const size = lead.size || lead.roof_size || 2000;
        const propertyType = extraData.propertyType || 'Residential';
        const service = extraData.service || 'Replacement';

        const estimate = extraData.estimate || calculateEstimate({
            material,
            stories,
            condition,
            service,
            property_type: propertyType,
            roof_size: size
        });

        // Initialize PDF Document
        const pdfDoc = await PDFDocument.create();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
        
        const page = pdfDoc.addPage([612, 792]); // Letter size (8.5 x 11 inches)
        
        // Helper to draw text with word wrap in pdf-lib
        function drawWrappedText(page, text, x, y, maxWidth, font, fontSize, color) {
            const words = text.split(' ');
            let currentLine = '';
            let currentY = y;

            for (let i = 0; i < words.length; i++) {
                const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
                const testWidth = font.widthOfTextAtSize(testLine, fontSize);
                if (testWidth > maxWidth && currentLine !== '') {
                    page.drawText(currentLine, { x, y: currentY, size: fontSize, font, color });
                    currentLine = words[i];
                    currentY -= (fontSize + 3);
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) {
                page.drawText(currentLine, { x, y: currentY, size: fontSize, font, color });
                currentY -= (fontSize + 3);
            }
            return currentY;
        }

        // Colors
        const navyDark = rgb(0.06, 0.11, 0.20);      // #0F172A (Deep Slate Navy)
        const navyHeader = rgb(0.12, 0.18, 0.29);    // #1E293B (Table Header Slate)
        const primaryColor = rgb(0.09, 0.15, 0.27);  // #172554
        const accentTeal = rgb(0.11, 0.68, 0.54);    // #1BAE8A (Quotramax Teal)
        const grayColor = rgb(0.40, 0.45, 0.55);      // Slate gray
        const greenColor = rgb(0.06, 0.55, 0.38);     // Emerald green
        const redColor = rgb(0.80, 0.15, 0.15);       // Warning red
        const bgCard = rgb(0.97, 0.98, 0.99);        // #F8FAFC
        const bgRowAlt = rgb(0.95, 0.96, 0.98);      // Light alternating row
        const borderLightColor = rgb(0.88, 0.90, 0.93); // Light border gray

        // ------------------ 1. EXECUTIVE HEADER BANNER ------------------
        page.drawRectangle({
            x: 0,
            y: 728,
            width: 612,
            height: 64,
            color: navyDark
        });
        page.drawRectangle({
            x: 0,
            y: 724,
            width: 612,
            height: 4,
            color: accentTeal
        });

        page.drawText('QUOTRAMAX', { x: 40, y: 756, size: 20, font: helveticaBold, color: rgb(1, 1, 1) });
        page.drawText('OFFICIAL PRELIMINARY ESTIMATE REPORT', { x: 40, y: 740, size: 8, font: helveticaBold, color: accentTeal });

        const dateStr = new Date(lead.date || Date.now()).toISOString().split('T')[0];
        page.drawText(`ESTIMATE NO: EST-${id.substring(0, 8).toUpperCase()}`, { x: 410, y: 756, size: 9, font: helveticaBold, color: rgb(1, 1, 1) });
        page.drawText(`DATE ISSUED: ${dateStr}`, { x: 410, y: 740, size: 8, font: helveticaFont, color: rgb(0.75, 0.80, 0.90) });

        // ------------------ 2. CUSTOMER & PROPERTY CARD ------------------
        page.drawRectangle({
            x: 40,
            y: 628,
            width: 532,
            height: 82,
            color: bgCard,
            borderColor: borderLightColor,
            borderWidth: 1
        });
        page.drawRectangle({
            x: 40,
            y: 690,
            width: 532,
            height: 20,
            color: rgb(0.91, 0.94, 0.97)
        });
        page.drawText('1. CUSTOMER & PROPERTY INFORMATION', { x: 50, y: 696, size: 9, font: helveticaBold, color: primaryColor });

        // Left Col
        page.drawText('Prepared For:', { x: 50, y: 672, size: 8.5, font: helveticaBold, color: grayColor });
        page.drawText(lead.name || 'Valued Homeowner', { x: 125, y: 672, size: 8.5, font: helveticaFont, color: primaryColor });

        page.drawText('Property Addr:', { x: 50, y: 654, size: 8.5, font: helveticaBold, color: grayColor });
        page.drawText(lead.address || 'Address on file', { x: 125, y: 654, size: 8.5, font: helveticaFont, color: primaryColor });

        page.drawText('Email Address:', { x: 50, y: 636, size: 8.5, font: helveticaBold, color: grayColor });
        page.drawText(lead.email || 'Not provided', { x: 125, y: 636, size: 8.5, font: helveticaFont, color: primaryColor });

        // Right Col
        page.drawText('Phone Number:', { x: 330, y: 672, size: 8.5, font: helveticaBold, color: grayColor });
        page.drawText(lead.phone || 'Not provided', { x: 410, y: 672, size: 8.5, font: helveticaFont, color: primaryColor });

        page.drawText('Property Type:', { x: 330, y: 654, size: 8.5, font: helveticaBold, color: grayColor });
        page.drawText(propertyType, { x: 410, y: 654, size: 8.5, font: helveticaFont, color: primaryColor });

        page.drawText('Service Type:', { x: 330, y: 636, size: 8.5, font: helveticaBold, color: grayColor });
        page.drawText(service, { x: 410, y: 636, size: 8.5, font: helveticaFont, color: primaryColor });

        // ------------------ 3. PROJECT SPECIFICATIONS TABLE ------------------
        page.drawText('2. PROJECT SPECIFICATIONS & ASSESSMENTS', { x: 40, y: 610, size: 9.5, font: helveticaBold, color: primaryColor });

        // Table Header
        page.drawRectangle({ x: 40, y: 588, width: 532, height: 18, color: navyHeader });
        page.drawText('SPECIFICATION', { x: 50, y: 593, size: 8, font: helveticaBold, color: rgb(1, 1, 1) });
        page.drawText('VALUE / SELECTION', { x: 220, y: 593, size: 8, font: helveticaBold, color: rgb(1, 1, 1) });
        page.drawText('DETAILS', { x: 400, y: 593, size: 8, font: helveticaBold, color: rgb(1, 1, 1) });

        const specs = [
            ['Calculated Roof Footprint', `${size.toLocaleString()} sq ft`, 'Includes standard pitch & waste factor'],
            ['Structure Story Height', `${stories} Story`, 'Determines access & rigging complexity'],
            ['Material Selection', material, 'Manufacturer grade specification'],
            ['Current Roof Condition', condition, 'Age and structural wear assessment'],
            ['Service Goal', service, 'Full replacement or tear-off scope']
        ];

        let specY = 570;
        specs.forEach((spec, idx) => {
            if (idx % 2 === 0) {
                page.drawRectangle({ x: 40, y: specY - 3, width: 532, height: 16, color: bgRowAlt });
            }
            page.drawText(spec[0], { x: 50, y: specY, size: 8, font: helveticaBold, color: primaryColor });
            page.drawText(spec[1], { x: 220, y: specY, size: 8, font: helveticaFont, color: primaryColor });
            page.drawText(spec[2], { x: 400, y: specY, size: 8, font: helveticaOblique, color: grayColor });
            specY -= 16;
        });

        // Outer border for table
        page.drawRectangle({ x: 40, y: 487, width: 532, height: 119, color: rgb(0, 0, 0), borderWidth: 0.5, borderColor: borderLightColor });

        // ------------------ 4. ESTIMATED BUDGET RANGE (HERO CARD) ------------------
        page.drawRectangle({
            x: 40,
            y: 402,
            width: 532,
            height: 72,
            color: rgb(0.94, 0.98, 0.96),
            borderColor: accentTeal,
            borderWidth: 1.5
        });

        page.drawText('ESTIMATED INSTALLED TOTAL BUDGET RANGE', { x: 55, y: 454, size: 9, font: helveticaBold, color: rgb(0.15, 0.40, 0.30) });
        page.drawText(`$${estimate.minPrice.toLocaleString()} – $${estimate.maxPrice.toLocaleString()} USD`, {
            x: 55, y: 424, size: 22, font: helveticaBold, color: greenColor
        });

        page.drawText('*Includes complete materials, certified labor, tear-off disposal, permits, and safety setup.', {
            x: 55, y: 410, size: 7.5, font: helveticaOblique, color: grayColor
        });

        // ------------------ 5. ITEMIZED COST BREAKDOWN ------------------
        page.drawText('3. ITEMIZED COST ESTIMATE BREAKDOWN', { x: 40, y: 385, size: 9.5, font: helveticaBold, color: primaryColor });

        page.drawRectangle({ x: 40, y: 363, width: 532, height: 18, color: navyHeader });
        page.drawText('COST CATEGORY', { x: 50, y: 368, size: 8, font: helveticaBold, color: rgb(1, 1, 1) });
        page.drawText('DESCRIPTION & SCOPE INCLUDED', { x: 180, y: 368, size: 8, font: helveticaBold, color: rgb(1, 1, 1) });
        page.drawText('ESTIMATED COST', { x: 460, y: 368, size: 8, font: helveticaBold, color: rgb(1, 1, 1) });

        const breakdownItems = [
            ['Premium Materials', 'Shingles/Metal, underlayment, drip edge, flashing & fasteners', `$${estimate.breakdown.materials.toLocaleString()}`],
            ['Installation & Labor', 'Old roof tear-off, deck prep, professional installation & safety', `$${estimate.breakdown.labor.toLocaleString()}`],
            ['Permits & Disposal', 'Local municipal building permit, dumpster rental & haul-away', `$${estimate.breakdown.fees.toLocaleString()}`]
        ];

        let itemY = 345;
        breakdownItems.forEach((item, idx) => {
            if (idx % 2 === 0) {
                page.drawRectangle({ x: 40, y: itemY - 3, width: 532, height: 16, color: bgRowAlt });
            }
            page.drawText(item[0], { x: 50, y: itemY, size: 8, font: helveticaBold, color: primaryColor });
            page.drawText(item[1], { x: 180, y: itemY, size: 8, font: helveticaFont, color: grayColor });
            page.drawText(item[2], { x: 460, y: itemY, size: 8, font: helveticaBold, color: primaryColor });
            itemY -= 16;
        });

        // Total Row
        page.drawRectangle({ x: 40, y: 290, width: 532, height: 22, color: rgb(0.91, 0.94, 0.97) });
        page.drawText('ESTIMATED PROJECT MIDPOINT TOTAL', { x: 50, y: 297, size: 9, font: helveticaBold, color: primaryColor });
        const midTotal = Math.round((estimate.minPrice + estimate.maxPrice) / 2);
        page.drawText(`$${midTotal.toLocaleString()} USD`, { x: 460, y: 297, size: 10, font: helveticaBold, color: greenColor });

        // Outer border for breakdown table
        page.drawRectangle({ x: 40, y: 290, width: 532, height: 91, color: rgb(0, 0, 0), borderWidth: 0.5, borderColor: borderLightColor });

        // ------------------ 6. IMPORTANT NOTICES / ALERT BOX ------------------
        page.drawRectangle({
            x: 40,
            y: 200,
            width: 532,
            height: 75,
            color: rgb(0.99, 0.96, 0.96),
            borderColor: rgb(0.90, 0.50, 0.50),
            borderWidth: 1
        });

        page.drawText('IMPORTANT NOTICE & ON-SITE INSPECTION RECOMMENDATION', { x: 52, y: 260, size: 8.5, font: helveticaBold, color: redColor });
        
        const disclaimerNotice = 'This preliminary estimate report is generated automatically based on regional material costs and property square footage. It serves as an initial budget guideline and is non-binding. Final pricing requires a certified on-site physical roof inspection to assess underlayment deck integrity, local municipal codes, and structural ventilation requirements.';
        drawWrappedText(page, disclaimerNotice, 52, 246, 510, helveticaFont, 7.5, primaryColor);

        // ------------------ 7. TERMS & CONTRACTOR CONTACT FOOTER ------------------
        page.drawRectangle({
            x: 40,
            y: 110,
            width: 532,
            height: 75,
            color: bgCard,
            borderColor: borderLightColor,
            borderWidth: 1
        });

        page.drawText('4. NEXT STEPS TO LOCK IN YOUR EXACT PRICE', { x: 50, y: 170, size: 8.5, font: helveticaBold, color: primaryColor });
        page.drawText('• Schedule a complimentary 15-minute physical inspection to confirm material specs.', { x: 50, y: 155, size: 8, font: helveticaFont, color: grayColor });
        page.drawText('• Receive an official binding contract with guaranteed warranty coverage.', { x: 50, y: 142, size: 8, font: helveticaFont, color: grayColor });

        page.drawText('Contractor Contact Email:', { x: 50, y: 124, size: 8, font: helveticaBold, color: primaryColor });
        page.drawText('isaaqabukar1@gmail.com', { x: 160, y: 124, size: 8, font: helveticaBold, color: accentTeal });

        // Page Bottom Divider & Footer text
        page.drawLine({ start: { x: 40, y: 45 }, end: { x: 572, y: 45 }, thickness: 0.5, color: borderLightColor });
        page.drawText('Quotramax Automated Estimator System • Official Preliminary Document', { x: 40, y: 32, size: 7.5, font: helveticaOblique, color: grayColor });
        page.drawText('Page 1 of 1', { x: 525, y: 32, size: 7.5, font: helveticaBold, color: grayColor });

        // Save PDF to buffer
        const pdfBytes = await pdfDoc.save();

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Quotramax_Estimate_${id}.pdf"`,
                'Content-Length': pdfBytes.length.toString()
            }
        });
    } catch (e) {
        console.error('PDF generation API error:', e);
        return new Response('Internal Server Error', { status: 500 });
    }
}
