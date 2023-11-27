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

export const PointsVsLeagueAvgByWeekChart = ({data}: { data: LineData }) => {
    console.log(data);
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
                                text: 'score',
                            },
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'week',
                            },
                        },
                    },
                }}
            />
        </div>
    )
}
