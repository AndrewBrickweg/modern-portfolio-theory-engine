import { useState } from "react";

interface TVMCalculatorProps {
  onChange: (data: {
    initialInvestment: number;
    monthlyContribution: number;
    years: number;
    expectedReturn: number;
    variance: number;
  }) => void;
  defaults?: {
    initialInvestment: number;
    monthlyContribution: number;
    years: number;
    expectedReturn: number;
    variance: number;
  };
}

type Inputs = {
  initialInvestment: string;
  monthlyContribution: string;
  years: string;
  expectedReturn: string;
  variance: string;
};

const toNumber = (s: string) => {
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : 0;
};

const TVMCalculator = ({ onChange, defaults }: TVMCalculatorProps) => {
  const [inputs, setInputs] = useState<Inputs>(() => ({
    initialInvestment: defaults?.initialInvestment
      ? String(defaults.initialInvestment)
      : "",
    monthlyContribution: defaults?.monthlyContribution
      ? String(defaults.monthlyContribution)
      : "",
    years: defaults?.years ? String(defaults.years) : "",
    expectedReturn: defaults?.expectedReturn
      ? String(defaults.expectedReturn)
      : "",
    variance: defaults?.variance ? String(defaults.variance) : "",
  }));

  const handleChange = (field: keyof Inputs, raw: string) => {
    const updated = { ...inputs, [field]: raw };
    setInputs(updated);

    onChange({
      initialInvestment: toNumber(updated.initialInvestment),
      monthlyContribution: toNumber(updated.monthlyContribution),
      years: toNumber(updated.years),
      expectedReturn: toNumber(updated.expectedReturn),
      variance: toNumber(updated.variance),
    });
  };

  return (
    <div>
      {/* TVM Assumptions */}
      <section className="container mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow mb-10">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
          Enter your assumptions for the TVM calculation.
        </h3>
        <form className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Initial Investment ($)
          </p>
          <input
            type="number"
            placeholder="Initial Investment ($)"
            value={inputs.initialInvestment}
            onChange={(e) => handleChange("initialInvestment", e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monthly Contribution ($)
          </p>
          <input
            type="number"
            placeholder="Monthly Contribution ($)"
            value={inputs.monthlyContribution}
            onChange={(e) =>
              handleChange("monthlyContribution", e.target.value)
            }
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Time Horizon (years)
          </p>
          <input
            type="number"
            placeholder="Time Horizon (years)"
            value={inputs.years}
            onChange={(e) => handleChange("years", e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Estimated Annual Return (%)
          </p>
          <input
            type="number"
            placeholder="Estimated Annual Return (%)"
            value={inputs.expectedReturn}
            onChange={(e) => handleChange("expectedReturn", e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Estimated Rate Variance (%)
          </p>
          <input
            type="number"
            placeholder="Estimated rate variance (%)"
            value={inputs.variance}
            onChange={(e) => handleChange("variance", e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
          />
        </form>
      </section>
    </div>
  );
};

export default TVMCalculator;
