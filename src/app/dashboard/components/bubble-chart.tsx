'use client'
import { Bubble } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface bubbleData {
    datasets: {
        label: string;
        data: {
            x: number;
            y: number;
            r: number;
        }[];
    }[];
}


export const BubbleChart = ({data}: { data: bubbleData }) => {
    return (
        <div>
            <Bubble
                data={data}
                options={{
                    animations: {
                        radius: {
                            duration: 400,
                            easing: 'linear',
                            loop: (context) => context.active,
                        },
                    },
                    scales: {
                        y: {
                            title: {
                                display: true,
                                text: 'Percentage of Losses That Are NOT Self Inflicted',
                            },
                            ticks: {
                                stepSize: 1,
                            },
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Win/Loss Differential',
                            },
                            ticks: {
                                stepSize: 1,
                            },
                        },
                    },
                }}
            />
        </div>
    )
}
