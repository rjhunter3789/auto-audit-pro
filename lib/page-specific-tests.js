/*
 * Auto Audit Pro - Professional Dealership Website Analysis Platform
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * Page-Specific Tests
 * Deep dive analysis for VDP, Service, Inventory, and other pages
 */

// VDP (Vehicle Detail Page) Specific Tests
async function auditVDP($, url) {
    const issues = [];
    const insights = [];
    let score = 0;
    const maxScore = 10;

    // Test 1: Vehicle Images
    const images = $('img').filter((i, el) => {
        const src = $(el).attr('src') || '';
        const alt = $(el).attr('alt') || '';
        return src.includes('vehicle') || src.includes('car') || 
               alt.toLowerCase().includes('vehicle') || alt.toLowerCase().includes('car');
    });
    
    if (images.length < 10) {
        issues.push({
            title: 'Insufficient vehicle images',
            details: `Only ${images.length} vehicle images found. Best practice is 20+ high-quality images including exterior, interior, and detail shots.`,
            priority: 'high',
            category: 'Content - VDP'
        });
    } else if (images.length < 20) {
        issues.push({
            title: 'Limited vehicle images',
            details: `${images.length} images found. Consider adding more angles, interior details, and feature highlights for better engagement.`,
            priority: 'medium',
            category: 'Content - VDP'
        });
        score += 0.5;
    } else {
        score += 1;
        insights.push('Excellent vehicle image gallery');
    }

    // Test 2: Pricing Information
    const pricePattern = /\$[\d,]+|\d{2},\d{3}|\d{3},\d{3}/;
    const hasPrice = pricePattern.test($('body').text());
    const hasMSRP = /MSRP|msrp|sticker/i.test($('body').text());
    const hasDisclaimer = /price.*excludes|plus.*fees|disclaimer/i.test($('body').text());
    
    if (!hasPrice) {
        issues.push({
            title: 'No pricing information found',
            details: 'Vehicle pricing is critical for transparency. Display MSRP, sale price, and any applicable discounts clearly.',
            priority: 'high',
            category: 'Content - VDP'
        });
    } else {
        score += 1;
        if (!hasDisclaimer) {
            issues.push({
                title: 'Missing pricing disclaimer',
                details: 'Add disclaimer about taxes, fees, and other charges to ensure compliance and transparency.',
                priority: 'medium',
                category: 'Compliance - VDP'
            });
        } else {
            score += 0.5;
        }
    }

    // Test 3: Vehicle Specifications
    const specKeywords = ['engine', 'transmission', 'mpg', 'fuel', 'drivetrain', 'cylinders'];
    const specCount = specKeywords.filter(keyword => 
        $('body').text().toLowerCase().includes(keyword)
    ).length;
    
    if (specCount < 3) {
        issues.push({
            title: 'Limited vehicle specifications',
            details: 'Add comprehensive vehicle specs including engine, transmission, MPG, features, and options.',
            priority: 'medium',
            category: 'Content - VDP'
        });
    } else {
        score += 1;
        insights.push('Good vehicle specification details');
    }

    // Test 4: Call-to-Action Elements
    const ctaButtons = $('button, a').filter((i, el) => {
        const text = $(el).text().toLowerCase();
        return text.includes('finance') || text.includes('payment') || 
               text.includes('test drive') || text.includes('contact') ||
               text.includes('check availability');
    });
    
    if (ctaButtons.length === 0) {
        issues.push({
            title: 'No clear CTAs on VDP',
            details: 'Add prominent buttons for financing, test drive scheduling, and contact. Multiple CTAs increase conversion.',
            priority: 'high',
            category: 'Lead Generation - VDP'
        });
    } else if (ctaButtons.length < 3) {
        issues.push({
            title: 'Limited CTAs on VDP',
            details: 'Consider adding more action buttons: Calculate Payment, Schedule Test Drive, Check Availability, Get ePrice.',
            priority: 'medium',
            category: 'Lead Generation - VDP'
        });
        score += 0.5;
    } else {
        score += 1;
        insights.push('Strong call-to-action presence');
    }

    // Test 5: Payment Calculator
    const hasCalculator = /payment|calculator|estimate.*payment|monthly/i.test($('body').text());
    if (!hasCalculator) {
        issues.push({
            title: 'No payment calculator found',
            details: 'Add an interactive payment calculator to help customers understand affordability. This significantly increases lead quality.',
            priority: 'high',
            category: 'Tools - VDP'
        });
    } else {
        score += 1;
        insights.push('Payment calculator available');
    }

    // Test 6: Vehicle History (for used)
    const isUsed = /used|pre-owned|preowned/i.test($('body').text());
    if (isUsed) {
        const hasCarfax = /carfax|autocheck|vehicle history/i.test($('body').text());
        if (!hasCarfax) {
            issues.push({
                title: 'No vehicle history report',
                details: 'Provide CARFAX or AutoCheck reports for used vehicles to build trust and transparency.',
                priority: 'high',
                category: 'Trust - VDP'
            });
        } else {
            score += 1;
            insights.push('Vehicle history report provided');
        }
    } else {
        score += 1; // Not applicable for new vehicles
    }

    return {
        score,
        maxScore,
        issues,
        insights,
        pageType: 'VDP'
    };
}

// Service Page Specific Tests
async function auditServicePage($, url) {
    const issues = [];
    const insights = [];
    let score = 0;
    const maxScore = 8;

    // Test 1: Online Scheduling
    const hasScheduling = /schedule.*service|book.*appointment|schedule.*online/i.test($('body').text());
    const schedulingButtons = $('button, a').filter((i, el) => {
        const text = $(el).text().toLowerCase();
        return text.includes('schedule') || text.includes('book') || text.includes('appointment');
    });
    
    if (!hasScheduling && schedulingButtons.length === 0) {
        issues.push({
            title: 'No online service scheduling',
            details: 'Add online appointment scheduling to reduce phone calls and improve customer convenience. This is now expected by most customers.',
            priority: 'high',
            category: 'Functionality - Service'
        });
    } else {
        score += 1;
        insights.push('Online scheduling available');
    }

    // Test 2: Service Menu/Pricing
    const hasMenu = /oil change|tire rotation|brake|maintenance|service menu/i.test($('body').text());
    const hasPricing = /\$\d+|\d+\.\d{2}/.test($('body').text());
    
    if (!hasMenu) {
        issues.push({
            title: 'No service menu found',
            details: 'Display common services offered with descriptions. Transparency builds trust and reduces friction.',
            priority: 'medium',
            category: 'Content - Service'
        });
    } else {
        score += 1;
        if (!hasPricing) {
            issues.push({
                title: 'No service pricing displayed',
                details: 'Consider showing pricing for common services like oil changes. Price transparency increases appointments.',
                priority: 'low',
                category: 'Content - Service'
            });
        } else {
            score += 0.5;
            insights.push('Service pricing transparency');
        }
    }

    // Test 3: Service Specials
    const hasSpecials = /special|coupon|save|offer|discount/i.test($('body').text());
    if (!hasSpecials) {
        issues.push({
            title: 'No service specials displayed',
            details: 'Promote current service specials and coupons prominently. Deals drive immediate action.',
            priority: 'medium',
            category: 'Marketing - Service'
        });
    } else {
        score += 1;
        insights.push('Service specials promoted');
    }

    // Test 4: Hours and Contact
    const hasHours = /hours|monday|tuesday|open|closed/i.test($('body').text());
    const hasPhone = /\d{3}[-.]?\d{3}[-.]?\d{4}/.test($('body').text());
    
    if (!hasHours) {
        issues.push({
            title: 'Service hours not displayed',
            details: 'Clearly display service department hours, including Saturday availability if applicable.',
            priority: 'high',
            category: 'Information - Service'
        });
    } else {
        score += 1;
    }
    
    if (!hasPhone) {
        issues.push({
            title: 'No service department phone',
            details: 'Display a direct service department phone number prominently for customers who prefer to call.',
            priority: 'medium',
            category: 'Contact - Service'
        });
    } else {
        score += 1;
    }

    // Test 5: Service Amenities
    const amenityKeywords = ['shuttle', 'loaner', 'wifi', 'coffee', 'waiting room', 'rental'];
    const amenityCount = amenityKeywords.filter(keyword => 
        $('body').text().toLowerCase().includes(keyword)
    ).length;
    
    if (amenityCount === 0) {
        issues.push({
            title: 'No service amenities mentioned',
            details: 'Highlight amenities like shuttle service, loaners, WiFi, and comfortable waiting areas to differentiate your service.',
            priority: 'low',
            category: 'Marketing - Service'
        });
    } else {
        score += 0.5;
        insights.push(`${amenityCount} service amenities highlighted`);
    }

    return {
        score,
        maxScore,
        issues,
        insights,
        pageType: 'Service'
    };
}

// Inventory/Search Page Tests
async function auditInventoryPage($, url) {
    const issues = [];
    const insights = [];
    let score = 0;
    const maxScore = 7;

    // Test 1: Search Filters
    const filterElements = $('select, input[type="checkbox"], input[type="radio"]').filter((i, el) => {
        const name = $(el).attr('name') || '';
        const id = $(el).attr('id') || '';
        return name.includes('filter') || name.includes('search') || 
               id.includes('filter') || id.includes('search');
    });
    
    if (filterElements.length < 5) {
        issues.push({
            title: 'Limited search filters',
            details: 'Add comprehensive filters: Make, Model, Year, Price Range, Mileage, Color, Features. More filters = better user experience.',
            priority: 'high',
            category: 'Functionality - Inventory'
        });
    } else {
        score += 1;
        insights.push('Comprehensive search filters');
    }

    // Test 2: Results Display
    const vehicleCards = $('[class*="vehicle"], [class*="inventory-item"], [class*="listing"]');
    const hasGrid = $('[class*="grid"], [class*="row"]').length > 0;
    
    if (vehicleCards.length === 0) {
        issues.push({
            title: 'No vehicle results visible',
            details: 'Ensure inventory displays properly with clear vehicle cards showing key information.',
            priority: 'high',
            category: 'Display - Inventory'
        });
    } else {
        score += 1;
        if (!hasGrid) {
            issues.push({
                title: 'Poor inventory layout',
                details: 'Use a responsive grid layout for inventory display. Allow users to switch between grid and list views.',
                priority: 'medium',
                category: 'UX - Inventory'
            });
        } else {
            score += 0.5;
        }
    }

    // Test 3: Sorting Options
    const hasSorting = /sort.*by|price.*low.*high|newest.*first/i.test($('body').text());
    if (!hasSorting) {
        issues.push({
            title: 'No sorting options',
            details: 'Add sorting by Price, Year, Mileage, and Date Listed. Sorting helps users find vehicles faster.',
            priority: 'medium',
            category: 'Functionality - Inventory'
        });
    } else {
        score += 1;
        insights.push('Sorting functionality available');
    }

    // Test 4: Quick View Info
    // Check if vehicle cards show essential info
    const essentialInfo = ['price', 'year', 'mileage', 'model'];
    const infoFound = essentialInfo.filter(info => 
        $('body').text().toLowerCase().includes(info)
    ).length;
    
    if (infoFound < 3) {
        issues.push({
            title: 'Insufficient quick view information',
            details: 'Display Price, Year, Make/Model, Mileage, and Key Features on inventory cards for quick scanning.',
            priority: 'medium',
            category: 'Content - Inventory'
        });
    } else {
        score += 1;
    }

    // Test 5: Mobile Responsiveness
    const hasViewport = $('meta[name="viewport"]').length > 0;
    if (!hasViewport) {
        issues.push({
            title: 'Not mobile optimized',
            details: '60% of inventory browsing happens on mobile. Ensure responsive design with touch-friendly filters.',
            priority: 'high',
            category: 'Mobile - Inventory'
        });
    } else {
        score += 1;
    }

    return {
        score,
        maxScore,
        issues,
        insights,
        pageType: 'Inventory'
    };
}

// Specials/Offers Page Tests
async function auditSpecialsPage($, url) {
    const issues = [];
    const insights = [];
    let score = 0;
    const maxScore = 5;

    // Test 1: Current Offers
    const offerDates = $('*').filter((i, el) => {
        const text = $(el).text();
        return /expires|valid.*through|ends/i.test(text);
    });
    
    if (offerDates.length === 0) {
        issues.push({
            title: 'No expiration dates on offers',
            details: 'Always show expiration dates on specials to create urgency and ensure compliance.',
            priority: 'high',
            category: 'Compliance - Specials'
        });
    } else {
        score += 1;
        insights.push('Offer expiration dates present');
    }

    // Test 2: Disclaimer Visibility
    const hasDisclaimer = /see dealer|details|restrictions|qualified buyers/i.test($('body').text());
    if (!hasDisclaimer) {
        issues.push({
            title: 'Missing offer disclaimers',
            details: 'Add clear disclaimers about qualifications, restrictions, and terms to avoid compliance issues.',
            priority: 'high',
            category: 'Compliance - Specials'
        });
    } else {
        score += 1;
    }

    // Test 3: CTA on Each Offer
    const offerSections = $('[class*="special"], [class*="offer"], [class*="deal"]');
    const ctaButtons = $('button, a').filter((i, el) => {
        const text = $(el).text().toLowerCase();
        return text.includes('claim') || text.includes('get') || text.includes('view');
    });
    
    if (ctaButtons.length < offerSections.length) {
        issues.push({
            title: 'Missing CTAs on offers',
            details: 'Each special should have a clear call-to-action button to capture interest immediately.',
            priority: 'medium',
            category: 'Lead Generation - Specials'
        });
    } else {
        score += 1;
    }

    return {
        score,
        maxScore,
        issues,
        insights,
        pageType: 'Specials'
    };
}

module.exports = {
    auditVDP,
    auditServicePage,
    auditInventoryPage,
    auditSpecialsPage
};