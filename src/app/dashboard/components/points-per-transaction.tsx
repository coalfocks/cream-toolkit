'use client'

import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface BarData {
    datasets: {
        label: string;
        data: number[];
    }[];
    labels: string[];
}

export const PointsPerTransactionChart = ({data}: { data: BarData }) => {
    return (
        <div>
            <Bar
                data={data}
                options={{
                    animations: {
                    },
                    scales: {
                        y: {
                            title: {
                                display: true,
                                text: 'Expected Pts Per Transaction',
                            },
                        },
                        x: {
                        },
                    },
                }}
            />
        </div>
    )
}
