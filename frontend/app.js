const CONTRACT_ADDRESS = '0xc26a0053fE1b4849F33409E2ddAC2F9C76484Af9';
const RPC_URL = 'https://sepolia-rpc.scroll.io';

const ABI = [
    "function getReadingsCount() external view returns (uint256)",
    "function getLastReadings(uint256 _count) external view returns (tuple(uint40 timestamp, int16 temperature, uint16 humidity)[])"
];

async function init() {
    const statusEl = document.getElementById('connectionStatus');

    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

        statusEl.textContent = 'Connected to Scroll Sepolia';
        statusEl.classList.add('connected');

        await fetchData(contract);

    } catch (error) {
        console.error('Initialization error:', error);
        statusEl.textContent = 'Connection Failed';
        statusEl.style.color = '#ef4444';
    }
}

async function fetchData(contract) {
    try {
        const count = await contract.getReadingsCount();
        const countInt = Number(count);

        if (countInt === 0) {
            document.getElementById('currentTemp').textContent = 'No Data';
            document.getElementById('currentHumidity').textContent = 'No Data';
            return;
        }

        // Fetch enough data to cover 2 hours (safely assuming 30s interval = ~240 readings, fetching 500 to be safe for gaps/bursts)
        const limit = 500;
        const readings = await contract.getLastReadings(limit);

        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000));

        // getLastReadings returns [newest, second_newest, ...]
        // We want chronological for chart: [oldest, ..., newest]
        const reversedReadings = [...readings].reverse();

        // Process data and filter by time
        const processedData = reversedReadings.map(r => ({
            timestamp: new Date(Number(r.timestamp) * 1000),
            temp: Number(r.temperature) / 10,
            humidity: Number(r.humidity)
        })).filter(d => d.timestamp >= twoHoursAgo);

        // Update Current Cards (Latest reading is the last one in the array)
        const latest = processedData[processedData.length - 1];
        if (latest) {
            document.getElementById('currentTemp').textContent = `${latest.temp.toFixed(1)}°C`;
            document.getElementById('currentHumidity').textContent = `${latest.humidity}%`;
            document.getElementById('lastUpdate').textContent = latest.timestamp.toLocaleString();
        }

        renderChart(processedData);

        // Reading list uses the original 'readings' array which is Newest First
        renderTable(readings);

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function renderTable(rawReadings) {
    const tbody = document.querySelector('#readingsTable tbody');
    tbody.innerHTML = '';

    rawReadings.forEach(r => {
        const tr = document.createElement('tr');

        const timestamp = new Date(Number(r.timestamp) * 1000).toLocaleString();
        const temp = (Number(r.temperature) / 10).toFixed(1);
        const humidity = Number(r.humidity);

        tr.innerHTML = `
            <td>${timestamp}</td>
            <td style="color: var(--temp-color); font-weight: 600;">${temp}°C</td>
            <td style="color: var(--humidity-color); font-weight: 600;">${humidity}%</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderChart(data) {
    const ctx = document.getElementById('sensorChart').getContext('2d');

    // Pass raw data objects to Chart.js for parsing
    const chartData = data.map(d => ({
        x: d.timestamp, // Date object
        y: d.temp,
        y1: d.humidity
    }));

    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: chartData,
                    parsing: { yAxisKey: 'y' },
                    borderColor: '#f43f5e',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    yAxisID: 'y',
                    tension: 0.2
                },
                {
                    label: 'Humidity (%)',
                    data: chartData,
                    parsing: { yAxisKey: 'y1' },
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    yAxisID: 'y1',
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#94a3b8' }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute',
                        displayFormats: {
                            minute: 'HH:mm'
                        },
                        tooltipFormat: 'PPpp'
                    },
                    grid: { color: '#334155' },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: '#334155' },
                    ticks: { color: '#94a3b8' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

init();
