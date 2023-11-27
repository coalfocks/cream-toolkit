'use client'
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface barData {
    datasets: {
        label: string;
        data: number[];
    }[];
    labels: string[];
}

export const PointsDiscrepancyChart = ({data}: { data: barData }) => {
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
                                text: 'Points',
                            },
                            stacked: true,
                        },
                        x: {
                            stacked: true,
                        },
                    },
                }}
            />
        </div>
    )
}
