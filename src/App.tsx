import { useState } from 'react';

import styles from './App.module.css';
import { ConnectionForm } from './components/ConnectionForm';
import { CurrencySelector } from './components/CurrencySelector';
import { Navigation } from './components/Navigation';
import { OffBudgetToggle } from './components/OffBudgetToggle';
import { OnBudgetTransfersToggle } from './components/OnBudgetTransfersToggle';
import { AccountBreakdownPage } from './components/pages/AccountBreakdownPage';
import { BudgetVsActualPage } from './components/pages/BudgetVsActualPage';
import { CalendarHeatmapPage } from './components/pages/CalendarHeatmapPage';
import { CategoryTrendsPage } from './components/pages/CategoryTrendsPage';
import { FutureProjectionPage } from './components/pages/FutureProjectionPage';
import { IntroPage } from './components/pages/IntroPage';
import { MonthlyBreakdownPage } from './components/pages/MonthlyBreakdownPage';
import { OutroPage } from './components/pages/OutroPage';
import { SavingsRatePage } from './components/pages/SavingsRatePage';
import { SpendingVelocityPage } from './components/pages/SpendingVelocityPage';
import { TopCategoriesPage } from './components/pages/TopCategoriesPage';
import { TopPayeesPage } from './components/pages/TopPayeesPage';
import { SettingsMenu } from './components/SettingsMenu';
import { useActualData } from './hooks/useActualData';
import { useLocalStorage } from './hooks/useLocalStorage';

const PAGES = [
  { component: IntroPage, id: 'intro' },
  { component: SavingsRatePage, id: 'savings-rate' },
  { component: AccountBreakdownPage, id: 'account-breakdown' },
  { component: MonthlyBreakdownPage, id: 'monthly-breakdown' },
  { component: TopCategoriesPage, id: 'top-categories' },
  { component: CategoryTrendsPage, id: 'category-trends' },
  { component: TopPayeesPage, id: 'top-payees' },
  { component: BudgetVsActualPage, id: 'budget-vs-actual' },
  { component: CalendarHeatmapPage, id: 'calendar-heatmap' },
  { component: SpendingVelocityPage, id: 'spending-velocity' },
  { component: FutureProjectionPage, id: 'future-projection' },
  { component: OutroPage, id: 'outro' },
];

function App() {
  const [currentPage, setCurrentPage] = useState(0);
  const [includeOffBudget, setIncludeOffBudget] = useLocalStorage('includeOffBudget', false);
  const [excludeOnBudgetTransfers, setExcludeOnBudgetTransfers] = useLocalStorage(
    'excludeOnBudgetTransfers',
    true,
  );
  const [overrideCurrency, setOverrideCurrency] = useLocalStorage<string | null>(
    'overrideCurrency',
    null,
  );
  const { data, loading, error, progress, fetchData, retransformData, retry } = useActualData();

  const handleConnect = async (file: File) => {
    await fetchData(
      file,
      includeOffBudget,
      excludeOnBudgetTransfers,
      overrideCurrency || undefined,
    );
  };

  const handleOffBudgetToggle = (value: boolean) => {
    setIncludeOffBudget(value);
    retransformData(value, excludeOnBudgetTransfers, overrideCurrency || undefined);
  };

  const handleOnBudgetTransfersToggle = (value: boolean) => {
    setExcludeOnBudgetTransfers(value);
    retransformData(includeOffBudget, value, overrideCurrency || undefined);
  };

  const handleCurrencyChange = (currencySymbol: string) => {
    // If the selected currency matches the default from database, clear the override
    const defaultCurrency = data?.currencySymbol || '$';
    if (currencySymbol === defaultCurrency) {
      setOverrideCurrency(null);
      retransformData(includeOffBudget, excludeOnBudgetTransfers, undefined);
    } else {
      setOverrideCurrency(currencySymbol);
      retransformData(includeOffBudget, excludeOnBudgetTransfers, currencySymbol);
    }
  };

  const handleNext = () => {
    if (currentPage < PAGES.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Show connection form if no data loaded
  if (!data && !loading) {
    return (
      <ConnectionForm
        onConnect={handleConnect}
        loading={loading}
        error={error}
        progress={progress}
        onRetry={retry}
      />
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <p>Loading your budget data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !data) {
    return <ConnectionForm onConnect={handleConnect} loading={false} error={error} />;
  }

  // Show wrapped pages
  if (data) {
    const CurrentPageComponent = PAGES[currentPage].component;
    const isIntroPage = currentPage === 0;

    const effectiveCurrency = overrideCurrency || data.currencySymbol || '$';

    return (
      <div className={styles.app}>
        <SettingsMenu>
          <OffBudgetToggle includeOffBudget={includeOffBudget} onToggle={handleOffBudgetToggle} />
          <OnBudgetTransfersToggle
            excludeOnBudgetTransfers={excludeOnBudgetTransfers}
            onToggle={handleOnBudgetTransfersToggle}
          />
          <CurrencySelector
            selectedCurrency={effectiveCurrency}
            defaultCurrency={data.currencySymbol || '$'}
            onCurrencyChange={handleCurrencyChange}
          />
        </SettingsMenu>
        {isIntroPage ? (
          <IntroPage
            data={
              effectiveCurrency !== data.currencySymbol
                ? { ...data, currencySymbol: effectiveCurrency }
                : data
            }
            onNext={handleNext}
          />
        ) : (
          <CurrentPageComponent
            data={
              effectiveCurrency !== data.currencySymbol
                ? { ...data, currencySymbol: effectiveCurrency }
                : data
            }
          />
        )}
        <Navigation
          currentPage={currentPage}
          totalPages={PAGES.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      </div>
    );
  }

  return null;
}

export default App;
