'use client'
import { Doughnut } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface doughnutData {
    datasets: {
        data: number[];
    }[];
    labels: string[];
}

export const TransactionTotalsChart = ({data}: { data: doughnutData }) => {
    return (
        <div>
            <Doughnut
                data={data}
                options={{
                    animations: {
                    },
                }}
            />
        </div>
    )
}
