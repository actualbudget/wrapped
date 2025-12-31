# Actual Budget 2025 Wrapped

A beautiful year-in-review application for your Actual Budget data, styled like Spotify Wrapped. View your income, expenses, top categories, transaction patterns, and more with stunning visualizations and animations.

## Features

- 📊 **Comprehensive Statistics**: Income vs expenses, top categories, top payees, transaction stats
- 📅 **Calendar Heatmap**: GitHub-style contribution graph showing transaction frequency
- 📈 **Beautiful Charts**: Interactive charts powered by Recharts
- 🎨 **Spotify Wrapped Style**: Vibrant gradients, bold typography, smooth animations
- 💾 **Data Caching**: Automatic caching with IndexedDB for faster subsequent loads
- 📥 **Export to Image**: Export any page as a PNG image
- ⌨️ **Keyboard Navigation**: Navigate with arrow keys
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js 18+ and Yarn
- A running Actual Budget server (local or remote)
- Your Actual Budget credentials (server URL, password, and Sync ID)
- Encryption password (if your budget file is encrypted)

## Architecture

This application uses a **backend proxy server** to communicate with the Actual Budget API, since the `@actual-app/api` package requires Node.js and cannot run directly in a browser.

The setup includes:

- **Frontend**: React app running in the browser (port 5173 by default)
- **Backend**: Express server proxy (port 3001) that handles Actual API calls

You need to run both the backend server and the frontend development server.

## Getting Started

### Installation

1. Clone or download this repository
2. Install dependencies:

```bash
yarn install
```

### Configuration

You can configure your Actual Budget connection in two ways:

#### Option 1: Environment Variables (Optional)

Create a `.env` file in the root directory:

```env
VITE_ACTUAL_SERVER_URL=http://localhost:5006
VITE_ACTUAL_PASSWORD=your-password
VITE_ACTUAL_BUDGET_ID=your-budget-id
```

#### Option 2: Connection Form

The app provides a connection form on startup where you can enter your credentials directly.

### Finding Your Sync ID

1. Open Actual Budget in your browser
2. Go to Settings → Show advanced settings
3. Copy the "Sync ID"

### Encryption Password

If your budget file is encrypted, you'll need to provide the encryption password in addition to your server password. Leave this field empty if your budget file is not encrypted.

### Running the Application

You need to run both the backend server and the frontend:

**Terminal 1 - Backend Server:**

```bash
yarn server
```

**Terminal 2 - Frontend:**

```bash
yarn dev
```

The backend server will run on `http://localhost:3001` and the frontend will open at `http://localhost:5173` (or the next available port).

The frontend is configured to proxy API requests to the backend automatically.

### Building for Production

```bash
yarn build
```

The built files will be in the `dist` directory.

## Usage

1. **Connect to Actual Budget**: Enter your server URL, password, and Budget ID in the connection form
2. **Wait for Data Loading**: The app will fetch and process your 2025 budget data
3. **Navigate Through Pages**: Use the Next/Previous buttons or arrow keys to navigate through the wrapped pages
4. **Export Pages**: Click the export button on any page to download it as a PNG image
5. **Refresh Data**: Use the refresh button in the navigation to fetch fresh data (cache will be cleared)

## Pages

The wrapped includes the following pages:

1. **Intro**: Welcome page with overview statistics
2. **Income vs Expenses**: Comparison with donut chart
3. **Monthly Breakdown**: Bar chart showing income and expenses by month
4. **Top Categories**: Horizontal bar chart of top spending categories
5. **Category Trends**: Line chart showing spending trends for top categories
6. **Top Payees**: Horizontal bar chart of top payees by amount
7. **Transaction Stats**: Total count, average, and largest transaction
8. **Top Months**: Bar chart of spending by month with highlights
9. **Savings Rate**: Percentage and breakdown of savings
10. **Calendar Heatmap**: GitHub-style calendar showing transaction frequency
11. **Outro**: Final summary and thank you message

## Technology Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Framer Motion** for animations
- **Recharts** for data visualization
- **@actual-app/api** for Actual Budget integration
- **LocalForage** for IndexedDB caching
- **html2canvas** for image export
- **date-fns** for date utilities

## Data Caching

The app automatically caches your budget data in IndexedDB for 24 hours. This means:

- Subsequent visits will load instantly (if cache is valid)
- Data is stored locally in your browser
- You can use the refresh button to clear cache and fetch fresh data

## Troubleshooting

### Connection Issues

- Ensure your Actual Budget server is running and accessible
- Verify your server URL, password, and Budget ID are correct
- Check browser console for detailed error messages

### Missing Data

- Ensure you have transactions in 2025
- Check that your accounts are not marked as "off-budget" if needed
- Verify your Budget ID is correct

### Chart Not Displaying

- Check browser console for errors
- Ensure you have data for the selected year
- Try refreshing the data

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

Built for Actual Budget users who want to see their financial year in review. Inspired by Spotify Wrapped.
