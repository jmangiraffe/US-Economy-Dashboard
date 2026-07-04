// Point to your live backend (Ensure no trailing slash)
const API_BASE_URL = "https://us-economy-dashboard-98go.onrender.com";

async function initLiveTicker() {
    // 1. Grab all the target elements from the HTML
    const clockElement = document.getElementById('debt-clock');
    const velocityElement = document.getElementById('velocity-rate');
    
    // NEW: Grab the KPI elements
    const citizenElement = document.getElementById('metric-citizen');
    const gdpElement = document.getElementById('metric-gdp');
    const interestElement = document.getElementById('metric-interest');
    
    try {
        // 2. Fetch the data once
        const response = await fetch(`${API_BASE_URL}/api/v1/metrics/current`);
        const result = await response.json();
        
        let currentDebt = result.snapshot.total_debt_raw;
        const velocityPerSecond = result.velocity_per_second;
        
        // ==========================================
        // NEW: Populate the Static KPI Cards
        // ==========================================
        
        // Format debt per citizen as currency ($)
        citizenElement.textContent = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(result.snapshot.debt_per_citizen_raw);
        
        // Format GDP and Interest as percentages (%)
        gdpElement.textContent = `${result.snapshot.debt_to_gdp_ratio_raw}%`;
        interestElement.textContent = `${result.snapshot.average_interest_rate_raw}%`;
        
        // Set the velocity string
        velocityElement.textContent = velocityPerSecond.toLocaleString();
        
        // ==========================================
        // 3. Set up the Live Clock Math
        // ==========================================
        const ticksPerSecond = 30; // Creates a high-frequency fluid update cycle
        const incrementPerTick = velocityPerSecond / ticksPerSecond;
        
        setInterval(() => {
            currentDebt += incrementPerTick;
            
            // Format to USD currency
            clockElement.textContent = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
            }).format(currentDebt);
            
        }, 1000 / ticksPerSecond);
        
    } catch (error) {
        console.error("Failed to load metrics:", error);
        clockElement.textContent = "Data Sync Error";
        citizenElement.textContent = "Error";
        gdpElement.textContent = "Error";
        interestElement.textContent = "Error";
    }
}

// Start the engine when the script loads
initLiveTicker();
