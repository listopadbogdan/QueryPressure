import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { Chart, Legend, Tooltip } from 'chart.js';
import { Chart as ChartJS, LinearScale, LineController, LineElement, PointElement, Title } from 'chart.js';
import { LineChart, CartesianGrid, XAxis, YAxis, Line } from 'recharts';
import { useSearchParams } from 'react-router-dom';
import { log } from 'console';

ChartJS.register(LineController, LineElement, PointElement, LinearScale, Title);

const setupConnection = (id: string, setMetric: (total: number, throughputs_handled: number) => void) => {
    const connection = new HubConnectionBuilder()
        .withUrl(`/ws/dashboard?executionId=${id}`)
        .build();

    connection.on('live-metrics', (metric) => {
        setMetric(metric.metrics.filter((x: any) => x.name === 'live-request-count')[0].value,
        metric.metrics.filter((x: any) => x.name === 'live-throughput-handled')[0].value);
    });


    connection.start()
        .then(() => {
            console.log('SignalR connection established');
        })
        .catch((error) => {
            console.error('SignalR connection error:', error);
        });
};

export const ExecutionPage: React.FC = () => {
    const [searchParams] = useSearchParams();

    const id = searchParams.get("id");
    const [metric, setMetric] = useState<number>(0); // Initial metric value
    const [chartData, setChartData] = useState<{ x: number, y: number }[]>([]);

    const [chartDataThroughput, setChartDataThroughput] = useState<{ x: number, y: number }[]>([]);
    
    useEffect(() => {
        if (!id) return;
        setupConnection(id, (m, td) => {
            setMetric(m);
            setChartData(chartData => [...chartData, { y: m, x: chartData.length }]);
            setChartDataThroughput(chartDataThroughput => [...chartDataThroughput, { y: td, x: chartDataThroughput.length }]);
        });
    }, []);

    useEffect(() => {
        console.log(chartData);
    }, [chartData]);

    useEffect(() => {
        console.log(metric);
    }, [metric]);

    return (
        <>
            <div>
                <h1>Execution Page</h1>
                <p>ID: {id}</p>
                {/* Other content */}
            </div>
            <div>
                <p>Executed {metric}</p>
            </div>
            <div>
                <h2>Total executions</h2>
                <LineChart
                    width={500}
                    height={300}
                    data={chartData}
                    margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                    }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" />
                    <YAxis />
                    <Line type="monotone" dataKey="y" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
            </div>
            <div>
                <h2>Throughput handled</h2>
                <LineChart
                    width={500}
                    height={300}
                    data={chartDataThroughput}
                    margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                    }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" />
                    <YAxis />
                    <Line type="monotone" dataKey="y" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
            </div>
            <div>
                <h2>Results: summary</h2>
                <table border={1}>
                    <tr>
                        <td>min</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>q1</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>median</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>q3</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>max</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>mean</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>standard-deviation</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>standard-error</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>confidence-interval</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>error-count</td>
                        <td></td>
                    </tr>
                </table>
            </div>
            <div>
                <h2>Results: histogram</h2>
            </div>
        </>
    );
};