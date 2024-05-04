import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { Chart as ChartJS, LinearScale, LineController, LineElement, PointElement, Title } from 'chart.js';
import { Bar, Tooltip, Legend, BarChart, LineChart, CartesianGrid, XAxis, YAxis, Line } from 'recharts';
import { useSearchParams } from 'react-router-dom';
import { log } from 'console';

ChartJS.register(LineController, LineElement, PointElement, LinearScale, Title);

const setupConnection = (id: string, setMetric: (total: number, throughputs_handled: number) => void, setResults: (obj: any) => void) => {
    const connection = new HubConnectionBuilder()
        .withUrl(`/ws/dashboard?executionId=${id}`)
        .build();

    connection.on('live-metrics', (metric) => {
        setMetric(metric.metrics.filter((x: any) => x.name === 'live-request-count')[0].value,
        metric.metrics.filter((x: any) => x.name === 'live-throughput-handled')[0].value);
    });
    connection.on('execution-completed', (metric) => {
        setResults(metric.metrics);
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
    const [r_min, setRMin] = useState<number>(0); // Initial metric value
    const [r_max, setRMax] = useState<number>(0); // Initial metric value
    const [r_q1, setRQ1] = useState<number>(0); // Initial metric value
    const [r_q3, setRQ3] = useState<number>(0); // Initial metric value
    const [r_median, setRMedian] = useState<number>(0); // Initial metric value
    const [r_mean, setRMean] = useState<number>(0); // Initial metric value
    const [r_std_deviation, setRStdDeviation] = useState<number>(0); // Initial metric value
    const [r_std_error, setRStdErr] = useState<number>(0); // Initial metric value
    const [r_confidence_interval, setRConfInterval] = useState<number>(0); // Initial metric value
    const [r_histogram, setRHistogram] = useState<any[]>(); // Initial metric value
    const [chartData, setChartData] = useState<{ x: number, y: number }[]>([]);

    const [chartDataThroughput, setChartDataThroughput] = useState<{ x: number, y: number }[]>([]);
    
    useEffect(() => {
        if (!id) return;
        setupConnection(id, (m, td) => {
            setMetric(m);
            setChartData(chartData => [...chartData, { y: m, x: chartData.length }]);
            setChartDataThroughput(chartDataThroughput => [...chartDataThroughput, { y: td, x: chartDataThroughput.length }]);
        },
        (m) => {
            setRMin(m.filter((x: any) => x.name === 'min')[0].value["nanoseconds"]);
            setRMax(m.filter((x: any) => x.name === 'max')[0].value["nanoseconds"]);
            setRQ1(m.filter((x: any) => x.name === 'q1')[0].value["nanoseconds"]);
            setRMedian(m.filter((x: any) => x.name === 'median')[0].value["nanoseconds"]);
            setRQ3(m.filter((x: any) => x.name === 'q3')[0].value["nanoseconds"]);
            setRMean(m.filter((x: any) => x.name === 'mean')[0].value["nanoseconds"]);
            setRStdDeviation(m.filter((x: any) => x.name === 'standard-deviation')[0].value["nanoseconds"]);
            setRStdErr(m.filter((x: any) => x.name === 'standard-error')[0].value["nanoseconds"]);
            setRHistogram(m.filter((x: any) => x.name === 'histogram')[0].value);

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
                        <td>{r_min} ns</td>
                    </tr>
                    <tr>
                        <td>q1</td>
                        <td>{r_q1} ns</td>
                    </tr>
                    <tr>
                        <td>median</td>
                        <td>{r_median} ns</td>
                    </tr>
                    <tr>
                        <td>q3</td>
                        <td>{r_q3} ns</td>
                    </tr>
                    <tr>
                        <td>max</td>
                        <td>{r_max} ns</td>
                    </tr>
                    <tr>
                        <td>mean</td>
                        <td>{r_mean} ns</td>
                    </tr>
                    <tr>
                        <td>standard-deviation</td>
                        <td>{r_std_deviation} ns</td>
                    </tr>
                    <tr>
                        <td>standard-error</td>
                        <td>{r_std_error} ns</td>
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
                <BarChart
                  width={500}
                  height={300}
                  data={r_histogram}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5
                  }}
                  barSize={20}
                >
                  <XAxis dataKey="interval" scale="band" padding={{ left: 10, right: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Bar dataKey="value" fill="#8884d8" background={{ fill: "#eee" }} />
                </BarChart>
            </div>
        </>
    );
};