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
    // Note: Many dealership sites load images dynamically or use CDNs with varied naming
    const allImages = $('img').length;
    const largeImages = $('img').filter((i, el) => {
        const width = $(el).attr('width') || $(el).width();
        const height = $(el).attr('height') || $(el).height();
        return (parseInt(width) > 200 || parseInt(height) > 200);
    });
    
    // Check for image gallery indicators
    const hasGallery = $('.gallery, .carousel, .slider, .thumbnails, [class*="gallery"], [class*="carousel"], [class*="photo"]').length > 0;
    const hasThumbnails = $('img[class*="thumb"], img[src*="thumb"], .thumbnail').length > 3;
    
    // If we detect gallery elements but few large images, images likely load dynamically
    if (hasGallery || hasThumbnails) {
        if (largeImages.length < 5) {
            issues.push({
                title: 'Vehicle images may load dynamically',
                details: 'Image gallery detected but images appear to load on-demand. Manual review recommended to verify 20+ high-quality images are available.',
                priority: 'low',
                category: 'Manual Review - VDP'
            });
            score += 0.8; // Give most of the points since gallery exists
        } else {
            score += 1;
            insights.push('Vehicle image gallery detected');
        }
    } else if (largeImages.length < 10) {
        issues.push({
            title: 'Limited vehicle images detected',
            details: `Only ${largeImages.length} large images found on page. Best practice is 20+ high-quality images. Note: Some images may load dynamically and not be detected by this automated scan.`,
            priority: 'medium',
            category: 'Content - VDP'
        });
        score += 0.3;
    } else {
        score += 1;
        insights.push(`${largeImages.length}+ images available`);
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
    // More comprehensive filter detection for modern inventory systems
    const filterKeywords = [
        'year', 'make', 'model', 'price', 'mileage', 'color', 'body', 'style',
        'filter', 'search', 'refine', 'sort', 'transmission', 'engine', 'fuel',
        'drive', 'mpg', 'features', 'trim', 'interior', 'exterior', 'package'
    ];
    
    // Check for various filter implementations
    const selectFilters = $('select').filter((i, el) => {
        const attrs = ($(el).attr('name') || '') + ($(el).attr('id') || '') + 
                     ($(el).attr('class') || '') + ($(el).attr('data-filter') || '');
        return filterKeywords.some(keyword => attrs.toLowerCase().includes(keyword));
    });
    
    const inputFilters = $('input[type="checkbox"], input[type="radio"], input[type="range"]').filter((i, el) => {
        const attrs = ($(el).attr('name') || '') + ($(el).attr('id') || '') + 
                     ($(el).attr('class') || '') + ($(el).attr('data-filter') || '');
        const label = $(el).closest('label').text() || '';
        return filterKeywords.some(keyword => (attrs + label).toLowerCase().includes(keyword));
    });
    
    // Check for filter containers/sidebars
    const filterContainers = $('.filter, .filters, .refine, .search-filters, .inventory-filters, [class*="filter"], [class*="refine"]');
    const hasFilterUI = filterContainers.length > 0;
    
    // Check for faceted search or AJAX filter indicators
    const hasFacetedSearch = $('[data-facet], [class*="facet"], .ajax-filter').length > 0;
    
    const totalFilterElements = selectFilters.length + inputFilters.length;
    
    // More nuanced detection
    if (hasFilterUI || hasFacetedSearch) {
        if (totalFilterElements < 3) {
            // Has filter UI but few actual filters detected (likely dynamic loading)
            issues.push({
                title: 'Search filters may load dynamically',
                details: 'Filter interface detected but specific filters not visible in initial page load. Manual verification recommended.',
                priority: 'low',
                category: 'Manual Review - Inventory'
            });
            score += 0.8;
        } else {
            score += 1;
            insights.push(`${totalFilterElements}+ search filters available`);
        }
    } else if (totalFilterElements < 5) {
        issues.push({
            title: 'Limited search filters detected',
            details: 'Modern inventory search should include: Year, Make, Model, Price Range, Mileage, Body Style, and more. Note: Some filters may load dynamically.',
            priority: 'medium',
            category: 'Functionality - Inventory'
        });
        score += 0.3;
    } else {
        score += 1;
        insights.push('Comprehensive search filters detected');
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
    // More comprehensive mobile optimization detection
    const hasViewport = $('meta[name="viewport"]').length > 0;
    const viewportContent = $('meta[name="viewport"]').attr('content') || '';
    const hasProperViewport = viewportContent.includes('width=device-width');
    
    // Check for responsive design indicators
    const hasMediaQueries = $('style, link[rel="stylesheet"]').length > 0; // Basic check - most sites have styles
    const hasResponsiveClasses = $('[class*="mobile"], [class*="responsive"], [class*="col-"], [class*="grid"]').length > 0;
    const hasFlexOrGrid = $('[style*="flex"], [style*="grid"], [class*="flex"], [class*="grid"]').length > 0;
    
    // Check for mobile-unfriendly elements
    const hasFlash = $('object[type*="flash"], embed[type*="flash"]').length > 0;
    const hasFixedWidth = $('[style*="width:"][style*="px"]').filter((i, el) => {
        const style = $(el).attr('style') || '';
        const widthMatch = style.match(/width:\s*(\d+)px/);
        return widthMatch && parseInt(widthMatch[1]) > 600;
    }).length > 5; // More than 5 elements with fixed width > 600px
    
    if (!hasViewport) {
        issues.push({
            title: 'Missing mobile viewport meta tag',
            details: 'Add viewport meta tag for proper mobile rendering. This is a basic requirement for mobile optimization.',
            priority: 'medium',
            category: 'Technical - Mobile'
        });
    } else if (!hasProperViewport) {
        issues.push({
            title: 'Incomplete viewport configuration',
            details: 'Viewport meta tag should include "width=device-width" for proper responsive behavior.',
            priority: 'low',
            category: 'Technical - Mobile'
        });
        score += 0.5;
    } else if (hasFlash || hasFixedWidth) {
        issues.push({
            title: 'Mobile compatibility concerns detected',
            details: 'Found elements that may not work well on mobile devices (Flash content or fixed-width layouts). Manual review recommended.',
            priority: 'medium',
            category: 'Mobile - Inventory'
        });
        score += 0.5;
    } else {
        // Modern sites are generally mobile-ready if they have proper viewport
        score += 1;
        insights.push('Mobile-optimized viewport detected');
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