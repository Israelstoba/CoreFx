const API_KEY = '0f3c18d6653340208a3d6eeb83776ce2'; // Replace with your Twelve Data API key

// Function to fetch live market price and display it
async function fetchLivePrice(pair) {
  let symbol = pair.replace('/', ''); // Convert 'GBP/USD' → 'GBPUSD'
  let url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${API_KEY}`;

  try {
    let response = await fetch(url);
    let data = await response.json();
    if (data.price) {
      let price = parseFloat(data.price);
      document.getElementById(
        'market-price'
      ).textContent = `Market Price: ${price.toFixed(4)}`;
      return price;
    } else {
      console.error('Error fetching price:', data);
      return 1; // Default fallback
    }
  } catch (error) {
    console.error('Error:', error);
    return 1;
  }
}

// Event Listener to Fetch Market Price When Instrument is Selected
document.getElementById('pair').addEventListener('change', async function () {
  let selectedPair = this.value;
  await fetchLivePrice(selectedPair); // Fetch and display price
});

// Toggle between $ and % for Risk Input
let riskMode = '$'; // Default risk mode

document.querySelector('.swap-btn').addEventListener('click', function () {
  riskMode = riskMode === '$' ? '%' : '$';
  document.querySelector('.to-percent').textContent = riskMode;
});

// Calculate Lot Size
async function calculateLotSize() {
  let balance = parseFloat(document.getElementById('balance').value);
  let riskInput = parseFloat(document.getElementById('risk').value);
  let stopLossPips = parseFloat(document.getElementById('stop-loss').value);
  let pair = document.getElementById('pair').value;

  if (
    isNaN(balance) ||
    isNaN(riskInput) ||
    isNaN(stopLossPips) ||
    stopLossPips <= 0
  ) {
    alert('Please enter valid values.');
    return;
  }

  let marketPrice = await fetchLivePrice(pair); // Get the latest price

  // Convert risk percentage to dollar amount if necessary
  let riskAmount = riskMode === '%' ? (riskInput / 100) * balance : riskInput;

  let pipValue;

  // Pip Value Calculation Based on Pair Type
  if (pair.includes('JPY')) {
    pipValue = (0.01 / marketPrice) * 100000; // JPY pairs
  } else if (pair === 'XAU/USD') {
    pipValue = 1; // Gold pip value = $1 per point per lot
  } else if (pair === 'BTC/USD') {
    pipValue = 1 / marketPrice; // Bitcoin pip value = 1 USD per lot
  } else {
    pipValue = (0.0001 / marketPrice) * 100000; // Normal Forex pairs
  }

  // Correct Lot Size Formula for Gold & Bitcoin
  let lotSize;
  if (pair === 'XAU/USD') {
    lotSize = riskAmount / (stopLossPips * pipValue * 100); // Adjust for 100 oz per lot
  } else if (pair === 'BTC/USD') {
    lotSize = riskAmount / (stopLossPips * pipValue); // Bitcoin lot size is in whole units
  } else {
    lotSize = riskAmount / (stopLossPips * pipValue); // Standard Forex pairs
  }

  lotSize = lotSize.toFixed(2);

  document.querySelector('.lot-size').textContent = lotSize;
}
