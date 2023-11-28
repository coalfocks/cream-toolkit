'use client'
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface barData {
    datasets: {
        data: number[];
    }[];
    labels: string[];
}

export const PointsVsAvgDifferentialChart = ({data}: { data: barData }) => {
    console.log(data);
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
                                text: 'Points Differential VS League Avg',
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
