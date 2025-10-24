import { Expense } from "@/types/expense";
import LineChart from "./charts/LineChart";
import PieChart from "./charts/PieChart";

interface ChartPanelProps {
  expenses: Expense[];
}

export default function ChartPanel({ expenses }: ChartPanelProps) {
  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Dashboard
      </h2>
      {expenses.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No expenses found for this month.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h3 className="mb-2 text-center text-lg font-medium text-gray-800 dark:text-gray-200">
              Daily Spending
            </h3>
            <div className="relative h-64">
              <LineChart expenses={expenses} />
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h3 className="mb-2 text-center text-lg font-medium text-gray-800 dark:text-gray-200">
              Spending by Category
            </h3>
            <div className="relative mx-auto h-64 max-w-xs">
              <PieChart expenses={expenses} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}