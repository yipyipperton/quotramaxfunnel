// Deterministic 2026 Industry-Standard Pricing Engine for Quotramax Estimator

// Helper to detect 2026 regional labor multiplier based on address/ZIP or state
export function detectRegionMultiplier(address = '', customRegion = '') {
    if (customRegion) {
        const r = customRegion.toLowerCase();
        if (r.includes('northeast')) return { name: 'Northeast US', mult: 1.15 };
        if (r.includes('west coast') || r.includes('pacific')) return { name: 'West Coast US', mult: 1.25 };
        if (r.includes('mountain')) return { name: 'Mountain West US', mult: 1.10 };
        if (r.includes('midwest')) return { name: 'Midwest US', mult: 1.05 };
        if (r.includes('southwest')) return { name: 'Southwest US', mult: 0.95 };
        if (r.includes('southeast')) return { name: 'Southeast US', mult: 0.95 };
    }

    const addr = address.toUpperCase();
    
    // West Coast
    if (/\b(CA|WA|OR|CALIFORNIA|WASHINGTON|OREGON)\b/.test(addr)) {
        return { name: 'West Coast US', mult: 1.25 };
    }
    // Northeast
    if (/\b(NY|MA|CT|NJ|PA|RI|NH|VT|ME|NEW YORK|MASSACHUSETTS|PENNSYLVANIA|NEW JERSEY)\b/.test(addr)) {
        return { name: 'Northeast US', mult: 1.15 };
    }
    // Mountain West
    if (/\b(CO|UT|NV|ID|WY|MT|COLORADO|UTAH|NEVADA)\b/.test(addr)) {
        return { name: 'Mountain West US', mult: 1.10 };
    }
    // Midwest
    if (/\b(IL|MI|OH|IN|WI|MN|IA|MO|ND|SD|NE|KS|CHICAGO|DETROIT)\b/.test(addr)) {
        return { name: 'Midwest US', mult: 1.05 };
    }
    // Southwest
    if (/\b(TX|AZ|NM|OK|TEXAS|ARIZONA)\b/.test(addr)) {
        return { name: 'Southwest US', mult: 0.95 };
    }
    // Southeast (Default for FL, GA, NC, SC, TN, AL, etc.)
    return { name: 'Southeast US', mult: 0.95 };
}

export function calculateEstimate(lead, customSettings = null) {
    const material = lead.material || 'Asphalt shingles';
    const stories = (lead.stories || '1').toString();
    const condition = lead.condition || 'Good';
    const service = lead.service || 'Replacement';
    const propertyType = lead.propertyType || lead.property_type || 'Residential';
    
    // Sizing: Length x Width or Direct roof size
    let footprintLength = parseFloat(lead.footprintLength) || 0;
    let footprintWidth = parseFloat(lead.footprintWidth) || 0;
    let rawRoofSize = parseFloat(lead.roofSize || lead.roof_size || lead.size) || 2000;
    
    if (footprintLength > 0 && footprintWidth > 0) {
        rawRoofSize = footprintLength * footprintWidth;
    }

    const pitch = lead.pitch || 'Standard'; // Flat, Standard, Steep
    const complexity = lead.complexity || 'Gable'; // Gable, Hip, Valleys, Complex
    const layers = parseInt(lead.layers) || 1; // 1, 2, 3
    const address = lead.address || '';
    const customRegion = lead.region || '';

    // 1. Detect 2026 Regional Multiplier
    const regionData = detectRegionMultiplier(address, customRegion);
    const regionMult = customSettings?.regionMult || regionData.mult;

    // 2. Base Material & Labor Rates per Square (1 Square = 100 sq ft)
    // 2026 Industry Defaults (Configurable in Admin)
    let materialRatePerSq = customSettings?.materialRateAsphalt || 320; // $320/sq ($3.20/sq ft)
    let laborRatePerSq = customSettings?.laborRateAsphalt || 240;      // $240/sq ($2.40/sq ft)

    const matLower = material.toLowerCase();
    if (matLower.includes('metal')) {
        materialRatePerSq = customSettings?.materialRateMetal || 650;
        laborRatePerSq = customSettings?.laborRateMetal || 450;
    } else if (matLower.includes('tile') || matLower.includes('slate')) {
        materialRatePerSq = customSettings?.materialRateTile || 950;
        laborRatePerSq = customSettings?.laborRateTile || 550;
    } else if (matLower.includes('other')) {
        materialRatePerSq = customSettings?.materialRateOther || 450;
        laborRatePerSq = customSettings?.laborRateOther || 350;
    }

    // 3. Pitch Factors & Area Expansions
    let pitchAreaFactor = 1.12; // Standard 4/12-6/12 pitch
    let pitchLaborMult = 1.00;

    if (pitch.toLowerCase().includes('flat')) {
        pitchAreaFactor = 1.00;
        pitchLaborMult = 0.95;
    } else if (pitch.toLowerCase().includes('steep')) {
        pitchAreaFactor = 1.30;
        pitchLaborMult = 1.25; // 25% hazard & scaffolding labor surcharge
    }

    // 4. Complexity & Waste Factors
    let complexityMult = 1.00; // Gable
    let wasteFactor = 0.10;    // 10% waste

    const compLower = complexity.toLowerCase();
    if (compLower.includes('hip')) {
        complexityMult = 1.08;
        wasteFactor = 0.12;
    } else if (compLower.includes('valley') || compLower.includes('dormer') || compLower.includes('l-shape')) {
        complexityMult = 1.15;
        wasteFactor = 0.15;
    } else if (compLower.includes('complex') || compLower.includes('custom') || compLower.includes('turret')) {
        complexityMult = 1.25;
        wasteFactor = 0.18;
    }

    // 5. Story Height Multipliers
    let storyMult = 1.00;
    if (stories === '2') storyMult = customSettings?.mult2Story || 1.18;
    else if (stories === '3' || stories === '3+') storyMult = customSettings?.mult3Story || 1.35;

    // 6. Tear-off & Disposal Layer Multipliers
    let tearOffBaseRatePerSq = customSettings?.tearOffRate || 120; // $120/sq base tear-off
    let layersMult = 1.00;
    if (layers === 2) layersMult = 1.35; // 35% extra labor & dumpster fee
    else if (layers >= 3) layersMult = 1.65; // 65% extra labor & heavy disposal fee

    // 7. Calculate Roof Squares & Sloped Area
    const footprintSqFt = Math.round(rawRoofSize);
    const slopedSqFt = Math.round(footprintSqFt * pitchAreaFactor);
    const totalAdjustedSqFt = Math.round(slopedSqFt * (1 + wasteFactor));
    const squares = Math.max(10, Math.round((totalAdjustedSqFt / 100) * 10) / 10); // in squares (100 sq ft)

    // 8. Service Scope Differentiation: Localized Repair vs Complete Replacement
    const isRepair = service.toLowerCase().includes('repair');

    let materialsCost = 0;
    let laborCost = 0;
    let tearOffDisposalCost = 0;
    let feesCost = 0;

    if (isRepair) {
        // LOCALIZED REPAIR MODEL (Base mobilization + patch squares)
        const patchSquares = Math.max(1.5, Math.min(5, Math.round((squares * 0.10) * 10) / 10));
        const mobilizationFee = customSettings?.repairBaseFee || 450;
        
        materialsCost = patchSquares * materialRatePerSq;
        laborCost = (patchSquares * laborRatePerSq * 1.5) * storyMult * pitchLaborMult * regionMult;
        tearOffDisposalCost = patchSquares * 80 * layersMult;
        feesCost = mobilizationFee + 120; // Permit/inspection minimum
    } else {
        // FULL REPLACEMENT MODEL
        materialsCost = squares * materialRatePerSq;
        laborCost = (squares * laborRatePerSq) * storyMult * pitchLaborMult * complexityMult * regionMult;
        tearOffDisposalCost = squares * tearOffBaseRatePerSq * layersMult;
        
        const permitBase = customSettings?.permitFee || 250;
        const safetySurcharge = propertyType.toLowerCase() === 'commercial' ? 500 : 200;
        feesCost = permitBase + safetySurcharge;
    }

    // Apply Condition decking check (poor/old roofs require extra structural wood sheathing allowance)
    if (condition.toLowerCase() === 'poor' || lead.roofAge === '20+ years') {
        materialsCost *= 1.10; // 10% deck lumber allowance
        laborCost *= 1.08;
    }

    const totalCalculated = materialsCost + laborCost + tearOffDisposalCost + feesCost;
    
    // Price Range (+/- 7% accuracy band)
    const minPrice = Math.round((totalCalculated * 0.93) / 50) * 50;
    const maxPrice = Math.round((totalCalculated * 1.07) / 50) * 50;

    // 9. Formulate Clear Assumptions & Inclusions
    const assumptions = [
        `Base Footprint: ${footprintSqFt.toLocaleString()} sq ft (${slopedSqFt.toLocaleString()} sq ft sloped area)`,
        `Calculated Roof Scope: ${squares} Squares (100 sq ft / square)`,
        `Roof Shape Complexity: ${complexity} (${Math.round(wasteFactor * 100)}% waste factor allowance)`,
        `Shingle Layers Tear-off: ${layers} Layer(s) (${layersMult}x disposal factor)`,
        `Elevation & Pitch: ${stories} Story structure with ${pitch} slope (${pitchAreaFactor}x slope factor)`,
        `Regional Labor Benchmark: ${regionData.name} (${regionMult}x regional labor index)`
    ];

    const inclusions = [
        isRepair ? 'Targeted localized leak repair patch & seal' : 'Complete tear-off of existing shingle layers',
        'Synthetic water-resistant underlayment installation',
        'Ice & water shield protection at eaves and valleys',
        'Aluminum drip edge & pipe boot flashing replacements',
        'Dumpster rental & complete site magnetic sweep debris disposal',
        'Local municipal building permit filing & inspection compliance'
    ];

    const exclusions = [
        'Rotten plywood decking replacement beyond 2 sheet allowance',
        'Structural rafter/truss timber repairs',
        'Gutter & downspout replacement',
        'Skylight frame replacement or solar panel detach/re-install'
    ];

    const factors = [
        isRepair ? `Localized patch scope covering ~${Math.max(150, Math.round(slopedSqFt * 0.10))} sq ft.` : `Complete full roof replacement covering ${slopedSqFt.toLocaleString()} sloped sq ft.`,
        `Material Grade: Premium ${material} benchmark rates ($${materialRatePerSq}/square).`,
        `Labor Rate Index: ${regionData.name} baseline ($${laborRatePerSq}/square × ${regionMult}x region index).`,
        `Tear-off & Disposal: ${layers} layer(s) tear-off ($${Math.round(tearOffBaseRatePerSq * layersMult)}/square).`,
        `Roof Shape: ${complexity} design (${Math.round(wasteFactor * 100)}% material waste allowance).`
    ];

    return {
        minPrice,
        maxPrice,
        totalCalculated: Math.round(totalCalculated),
        squares,
        footprintSqFt,
        slopedSqFt,
        region: regionData.name,
        regionMult,
        serviceMode: isRepair ? 'Localized Repair' : 'Complete Replacement',
        factors,
        assumptions,
        inclusions,
        exclusions,
        breakdown: {
            materials: Math.round(materialsCost),
            labor: Math.round(laborCost),
            fees: Math.round(tearOffDisposalCost + feesCost)
        }
    };
}
