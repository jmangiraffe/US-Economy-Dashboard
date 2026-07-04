// Point to your live backend
const API_BASE_URL = "https://us-economy-dashboard-98go.onrender.com/";

// Tailwind Theme Colors extracted from your HTML for Chart.js
const theme = {
    primary: '#adc6ff',
    error: '#ffb4ab',
    tertiary: '#4ae176',
    secondary: '#ffb3ad',
    surfaceVariant: '#353534',
    onSurface: '#e5e2e1',
    onSurfaceVariant: '#c2c6d6'
};

// Global Chart.js Defaults for a premium look
Chart.defaults.color = theme.onSurfaceVariant;
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(28, 27, 27, 0.9)'; // surface-container-low
Chart.defaults.plugins.tooltip.titleColor = theme.onSurface;
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.1)';
Chart.defaults.plugins.tooltip.borderWidth = 1;

async function initCharts() {
    try {
        // Fetch baseline data from your backend
        const response = await fetch(`${API_BASE_URL}/api/v1/metrics/current`);
        const result = await response.json();
        const data = result.snapshot;
        const velocity = result.velocity_per_second;

        // Trillion Dollar Formatter for axes
        const formatTrillions = (value) => `$${(value / 1e12).toFixed(1)}T`;

        // ==========================================
        // 1. FISCAL VELOCITY (Real-time Line Chart)
        // ==========================================
        const ctxVelocity = document.getElementById('velocityChart').getContext('2d');
        const velocityData = Array(20).fill(velocity); // Start with flat baseline
        const velocityChart = new Chart(ctxVelocity, {
            type: 'line',
            data: {
                labels: Array(20).fill(''),
                datasets: [{
                    label: 'Debt Velocity ($/sec)',
                    data: velocityData,
                    borderColor: theme.error,
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    fill: true,
                    backgroundColor: 'rgba(255, 180, 171, 0.1)' // Faded error color
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: { display: false },
                    y: { 
                        display: true, 
                        grid: { color: theme.surfaceVariant },
                        border: { display: false }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });

        // Simulate real-time velocity micro-fluctuations
        setInterval(() => {
            const jitter = velocity + (Math.random() * 5000 - 2500);
            velocityChart.data.datasets[0].data.push(jitter);
            velocityChart.data.datasets[0].data.shift();
            velocityChart.update();
        }, 1000);

        // ==========================================
        // 2. ANNUAL BUDGET (Bar Chart)
        // ==========================================
        const ctxBudget = document.getElementById('budgetChart').getContext('2d');
        new Chart(ctxBudget, {
            type: 'bar',
            data: {
                labels: ['Revenue (Income)', 'Spending (Outgoing)'],
                datasets: [{
                    data: [data.federal_revenue_raw, data.federal_spending_raw],
                    backgroundColor: [theme.primary, theme.error],
                    borderRadius: 6,
                    barThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: theme.surfaceVariant },
                        border: { display: false },
                        ticks: { callback: formatTrillions }
                    },
                    x: { grid: { display: false }, border: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });

        // ==========================================
        // 3. DEBT TO GDP TREND (Historical Line Chart)
        // ==========================================
        const ctxTrend = document.getElementById('debtGdpTrendChart').getContext('2d');
        const currentYear = new Date().getFullYear();
        const years = Array.from({length: 10}, (_, i) => currentYear - 9 + i);
        
        // Simulating historical 10-year curve up to current debt
        const historicalDebt = years.map((y, i) => data.total_debt_raw * Math.pow(0.93, 9 - i));

        new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'National Debt',
                    data: historicalDebt,
                    borderColor: theme.secondary,
                    borderWidth: 3,
                    tension: 0.4,
                    pointBackgroundColor: theme.secondary
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        grid: { color: theme.surfaceVariant },
                        border: { display: false },
                        ticks: { callback: formatTrillions }
                    },
                    x: { grid: { display: false }, border: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });

        // ==========================================
        // 4. MACRO CONTEXT (Doughnut Chart)
        // ==========================================
        const ctxMacro = document.getElementById('macroContextChart').getContext('2d');
        new Chart(ctxMacro, {
            type: 'doughnut',
            data: {
                labels: ['Total Debt', 'Est. GDP', 'Annual Spending', 'Annual Revenue'],
                datasets: [{
                    data: [
                        data.total_debt_raw, 
                        28000000000000, // Static GDP approximation to prevent chart break if missing
                        data.federal_spending_raw, 
                        data.federal_revenue_raw
                    ],
                    backgroundColor: [theme.error, theme.primary, theme.secondary, theme.tertiary],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, usePointStyle: true } }
                }
            }
        });

        // ==========================================
        // 5. 10-YEAR PROJECTION (Interactive Area Chart)
        // ==========================================
        const ctxProj = document.getElementById('projectionChart').getContext('2d');
        const projYears = Array.from({length: 11}, (_, i) => currentYear + i);
        
        // Function to calculate compounding future debt
        const calculateProjections = (rate) => {
            return projYears.map((_, i) => data.total_debt_raw * Math.pow(rate, i));
        };

        const projectionChart = new Chart(ctxProj, {
            type: 'line',
            data: {
                labels: projYears,
                datasets: [{
                    label: 'Projected Debt',
                    data: calculateProjections(1.06), // Default 6%
                    borderColor: theme.tertiary,
                    backgroundColor: 'rgba(74, 225, 118, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 0,
                    pointHitRadius: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        grid: { color: theme.surfaceVariant },
                        border: { display: false },
                        ticks: { callback: formatTrillions }
                    },
                    x: { grid: { display: false }, border: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });

        // Listen for changes on the HTML select dropdown
        document.getElementById('growth-scenario').addEventListener('change', (e) => {
            const newRate = parseFloat(e.target.value);
            const newData = calculateProjections(newRate);
            
            // Update line color based on severity
            const newColor = newRate >= 1.09 ? theme.error : (newRate <= 1.03 ? theme.primary : theme.tertiary);
            const newBg = newRate >= 1.09 ? 'rgba(255, 180, 171, 0.1)' : (newRate <= 1.03 ? 'rgba(173, 198, 255, 0.1)' : 'rgba(74, 225, 118, 0.1)');

            projectionChart.data.datasets[0].data = newData;
            projectionChart.data.datasets[0].borderColor = newColor;
            projectionChart.data.datasets[0].backgroundColor = newBg;
            projectionChart.update();
        });

    } catch (error) {
        console.error("Chart rendering failed:", error);
    }
}

// Initialize when the script loads
initCharts();
