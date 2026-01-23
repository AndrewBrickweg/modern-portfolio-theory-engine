import {useState} from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";

const section = [

{
    id: "assumptions-and-concepts",
    title: "Core Assumptions and Concepts",
    content: "This engine requires historical price data for selected assets, which is used to calculate expected returns, volatilities, and correlations. Assumptions include market efficiency, investor rationality, and normally distributed returns."
},
{
    id: "Efficient-Frontier-and-Optimization",
    title: "Efficient Frontier and Optimization",
    content: "The efficient frontier represents the set of portfolios that offer the highest expected return for each level of risk. Portfolios below this frontier are sub-optimal because another exists with higher return and the same or lower risk. MPT uses covariance between asset returns, expected returns, and risk tolerance to identify these efficient combinations."
},
{
    id: "How-this-Engine-Works",
    title: "How this Engine Works",
    content: "This engine ingests historical adjusted close price data to compute asset returns, correlations, and a covariance matrix capturing inter-asset risk relationships. A mean-variance optimization routine and Monte Carlo simulation are then used to evaluate possible portfolio combinations and approximate the efficient frontier, identifying allocations that minimize risk for a given expected return. The resulting optimized weights and portfolio metrics are surfaced to the user and passed into downstream projection components for visualization under stated assumptions."
},
{
    id: "Practical-Applications",
    title: "Practical Applications and Limitations",
    content: "MPT relies on historical data and several simplifying assumptions, including normally distributed returns and stable correlations. Real markets often violate these assumptions, meaning optimized portfolios are illustrative, not predictive. MPT should be augmented with additional tools and judgment for practical investment decisions."
}
];

const AccordianInfo = () => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const toggleIndex = (index: number) => {
        if (activeIndex == index) {
            setActiveIndex(null);
        } else {
            setActiveIndex(index);
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            {section.map((sectionItem, index) => (
                <div key={sectionItem.id} className="border-b border-gray-300 dark:border-gray-700">
                    <button
                        onClick={() => toggleIndex(index)}
                        className="w-full flex justify-between items-center px-4 py-4 text-left"
                    >   
                      
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 py-2">
                            {sectionItem.title}

                        </h3>
                        <div>
                            {activeIndex === index ? (
                                <ChevronDownIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                            ) : (
                                <ChevronUpIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                            )}  
                            </div>
                        
                    </button>
                    {activeIndex === index && (
                        <div className="px-4 pb-4">
                            <p className="text-gray-600 dark:text-gray-400">
                                {sectionItem.content}
                            </p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default AccordianInfo;