import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

interface PortfolioChartProps {
  TVMData: {
    initialInvestment: number;
    monthlyContribution: number;
    years: number;
    expectedReturn: number;
    variance: number;
  };
}

const PortfolioChart = ({ TVMData }: PortfolioChartProps) => {
  const years = Math.max(0, Math.floor(TVMData.years));
  const startYear = new Date().getFullYear();

  const labels = Array.from(
    { length: years + 1 },
    (_, i) => `${startYear + i}`,
  );

  const PV = TVMData.initialInvestment || 0;
  const PMT = TVMData.monthlyContribution || 0;

  const rA = (TVMData.expectedReturn || 0) / 100;
  const rM = Math.pow(1 + rA, 1 / 12) - 1;

  const fvAtMonths = (months: number) => {
    if (months <= 0) return PV;

    if (rM === 0) {
      return PV + PMT * months;
    }

    const growth = Math.pow(1 + rM, months);
    const annuity = (growth - 1) / rM;
    return PV * growth + PMT * annuity;
  };

  const dataPoints = labels.map((_, i) => fvAtMonths(i * 12));

  const chartData = {
    labels,
    datasets: [
      {
        label: "TVM ",
        data: dataPoints,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
      },
    ],
  };

  return (
    <section className="container mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow mb-10">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
          Portfolio Growth Over Time
        </h3>
        <Line data={chartData} />
      </div>
    </section>
  );
};

export default PortfolioChart;
