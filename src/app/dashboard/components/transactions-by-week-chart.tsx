'use client'

import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface LineData {
    datasets: {
        label: string;
        data: number[];
    }[];
    labels: string[];
}

export const TransactionsByWeekChart = ({data}: { data: LineData }) => {
    return (
        <div>
            <Line
                data={data}
                options={{
                    animations: {
                    },
                    scales: {
                        y: {
                            title: {
                                display: true,
                                text: '# of Transactions',
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
