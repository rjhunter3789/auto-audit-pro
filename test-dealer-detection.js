const cheerio = require('cheerio');
const groupAnalysis = require('./lib/group-analysis');

// Sample HTML that mimics Kendall Auto Group structure
const testHTML = `
<html>
<body>
<nav>
    <a href="/locations">Our Locations</a>
    <a href="/about">About Us</a>
</nav>

<div class="locations-grid">
    <!-- Actual dealerships -->
    <div class="location-card">
        <a href="https://www.kendallford.com">Kendall Ford of Anchorage</a>
        <a href="https://www.kendallford.com" class="btn">Visit Site</a>
    </div>
    <div class="location-card">
        <a href="https://www.kendallchevrolet.com">Kendall Chevrolet</a>
        <a href="https://www.kendallchevrolet.com" class="btn">Visit Site</a>
    </div>
    <div class="location-card">
        <a href="/dealers/kendall-acura">Kendall Acura</a>
        <a href="/dealers/kendall-acura" class="btn">Visit Site</a>
    </div>
    <div class="location-card">
        <a href="/dealers/audi-bend">Audi Bend</a>
        <a href="/dealers/audi-bend" class="btn">Visit Site</a>
    </div>
    
    <!-- Department links that shouldn't be counted -->
    <div class="services">
        <a href="/commercial">Commercial</a>
        <a href="/fleet">Fleet</a>
        <a href="/service">Service</a>
        <a href="/parts">Parts</a>
        <a href="/body-shop">Body Shop</a>
        <a href="/platform-body-trucks">Platform Body Trucks</a>
    </div>
    
    <!-- More dealerships to test -->
    <div class="dealer-list">
        <a href="https://www.kendallhonda.com">Kendall Honda</a>
        <a href="https://www.kendallnissan.com">Kendall Nissan</a>
        <a href="https://www.kendalltoyota.com">Kendall Toyota</a>
        <a href="/dealers/kendall-mazda">Kendall Mazda</a>
        <a href="/dealers/kendall-hyundai">Kendall Hyundai</a>
        <a href="/dealers/kendall-kia">Kendall Kia</a>
        <a href="/dealers/kendall-subaru">Kendall Subaru</a>
        <a href="/dealers/kendall-volkswagen">Kendall Volkswagen</a>
        <a href="/dealers/kendall-lexus">Kendall Lexus</a>
        <a href="/dealers/kendall-bmw">Kendall BMW</a>
        <a href="/dealers/kendall-mercedes">Kendall Mercedes-Benz</a>
        <a href="/dealers/kendall-audi">Kendall Audi</a>
        <a href="/dealers/kendall-lincoln">Kendall Lincoln</a>
        <a href="/dealers/kendall-buick">Kendall Buick GMC</a>
        <a href="/dealers/kendall-chrysler">Kendall Chrysler Jeep Dodge Ram</a>
        <a href="/dealers/kendall-mitsubishi">Kendall Mitsubishi</a>
        <a href="/dealers/kendall-volvo">Kendall Volvo</a>
        <a href="/dealers/kendall-used">Kendall Used Car Superstore</a>
    </div>
    
    <!-- Duplicate links with "Visit Site" -->
    <div class="locations-alternate">
        <div><a href="https://www.kendallford.com">Visit Site</a></div>
        <div><a href="https://www.kendallchevrolet.com">Visit Site</a></div>
        <div><a href="/dealers/kendall-acura">Visit Site</a></div>
        <div><a href="/dealers/audi-bend">Visit Site</a></div>
        <div><a href="https://www.kendallhonda.com">Visit Site</a></div>
        <div><a href="https://www.kendallnissan.com">Visit Site</a></div>
        <div><a href="https://www.kendalltoyota.com">Visit Site</a></div>
        <div><a href="/dealers/kendall-mazda">Visit Site</a></div>
        <div><a href="/dealers/kendall-hyundai">Visit Site</a></div>
        <div><a href="/dealers/kendall-kia">Visit Site</a></div>
        <div><a href="/dealers/kendall-subaru">Visit Site</a></div>
        <div><a href="/dealers/kendall-volkswagen">Visit Site</a></div>
        <div><a href="/dealers/kendall-lexus">Visit Site</a></div>
        <div><a href="/dealers/kendall-bmw">Visit Site</a></div>
        <div><a href="/dealers/kendall-mercedes">Visit Site</a></div>
        <div><a href="/dealers/kendall-audi">Visit Site</a></div>
        <div><a href="/dealers/kendall-lincoln">Visit Site</a></div>
        <div><a href="/dealers/kendall-buick">Visit Site</a></div>
        <div><a href="/dealers/kendall-chrysler">Visit Site</a></div>
        <div><a href="/dealers/kendall-mitsubishi">Visit Site</a></div>
        <div><a href="/dealers/kendall-volvo">Visit Site</a></div>
        <div><a href="/dealers/kendall-used">Visit Site</a></div>
    </div>
</div>
</body>
</html>
`;

async function testDealerDetection() {
    console.log('Testing dealer detection logic...\n');
    
    const $ = cheerio.load(testHTML);
    const baseUrl = 'https://www.kendallautogroup.com';
    
    // First check what links exist
    console.log('All links with "kendall" in href:');
    $('a[href*="kendall"]').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        console.log(`  ${i+1}. Text: "${text}", Href: "${href}"`);
    });
    
    // Run the extraction
    const dealerLinks = await groupAnalysis.extractDealerLinks($, null, baseUrl);
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total dealers found: ${dealerLinks.length}`);
    console.log(`Expected: ~45 (Kendall has 45 dealerships)`);
    console.log(`\nIf this shows 77+, we're still counting duplicates`);
    console.log(`If this shows ~45, our deduplication is working`);
    
    // Show what types were found
    const internalCount = dealerLinks.filter(d => d.type === 'internal-page').length;
    const externalCount = dealerLinks.filter(d => d.type === 'external-site').length;
    console.log(`\nBreakdown:`);
    console.log(`- Internal pages: ${internalCount}`);
    console.log(`- External sites: ${externalCount}`);
}

testDealerDetection().catch(console.error);