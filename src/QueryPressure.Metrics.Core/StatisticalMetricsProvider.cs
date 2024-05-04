using Perfolizer.Horology;
using Perfolizer.Mathematics.Common;
using Perfolizer.Mathematics.Histograms;
using Perfolizer.Mathematics.QuantileEstimators;
using QueryPressure.Core.Interfaces;

namespace QueryPressure.Metrics.Core;

public class StatisticalMetricsProvider : IMetricProvider
{

  public Task<IEnumerable<IMetric>> CalculateAsync(IExecutionResultStore store, CancellationToken cancellationToken, bool simplifedHistogram = false)
  {
    var sorted = store.OrderBy(x => x.Duration)
      .Select(x => x.Duration.TotalNanoseconds)
      .ToList();

    var quartiles = Quartiles.FromSorted(sorted);
    var moments = Moments.Create(sorted);
    var standardError = moments.StandardDeviation / Math.Sqrt(sorted.Count);
    var confidenceInterval = new ConfidenceInterval(moments.Mean, standardError, sorted.Count);
    var histogram = BuildSimpleHistogram(sorted, moments.StandardDeviation);

    IEnumerable<IMetric> results = new IMetric[] {
      new SimpleMetric("min", TimeInterval.FromNanoseconds(quartiles.Min)),
      new SimpleMetric("q1", TimeInterval.FromNanoseconds(quartiles.Q1)),
      new SimpleMetric("median", TimeInterval.FromNanoseconds(quartiles.Median)),
      new SimpleMetric("q3", TimeInterval.FromNanoseconds(quartiles.Q3)),
      new SimpleMetric("max", TimeInterval.FromNanoseconds(quartiles.Max)),
      new SimpleMetric("mean", TimeInterval.FromNanoseconds(moments.Mean)),
      new SimpleMetric("standard-deviation", TimeInterval.FromNanoseconds(moments.StandardDeviation)),
      new SimpleMetric("standard-error", TimeInterval.FromNanoseconds(standardError)),
      new SimpleMetric("confidence-interval", confidenceInterval),
    };

    if (!simplifedHistogram)
    {
      results = results.Concat(new[] {new SimpleMetric("histogram", histogram)});
    }
    else
    {
      List<SimpleHistogram> sh = new List<SimpleHistogram>();
      string[] source1 = new string[histogram.Bins.Length];
      string[] source2 = new string[histogram.Bins.Length];
      Func<double, string> formatter = x =>
      {
        var timeInterval = TimeInterval.FromNanoseconds(x);
        return timeInterval.ToString();
      };
      for (int index = 0; index < histogram.Bins.Length; ++index)
      {
        source1[index] = formatter(histogram.Bins[index].Lower);
        source2[index] = formatter(histogram.Bins[index].Upper);
      }
      int totalWidth1 = ((IEnumerable<string>) source1).Max<string>((Func<string, int>) (it => it.Length));
      int totalWidth2 = ((IEnumerable<string>) source2).Max<string>((Func<string, int>) (it => it.Length));
      for (int index = 0; index < histogram.Bins.Length; ++index)
      {
        string interval = "[" + source1[index].PadLeft(totalWidth1) + " ; " + source2[index].PadLeft(totalWidth2) + ")";
        int value = histogram.Bins[index].Count;
        sh.Add(new SimpleHistogram(interval, value));
      }

      results = results.Concat(new[] {new SimpleMetric("histogram", sh)});
    }

    return Task.FromResult(results);
  }

  private static Histogram BuildSimpleHistogram(IReadOnlyList<double> list, double standardDeviation)
  {
    var histogramBinSize = SimpleHistogramBuilder.GetOptimalBinSize(list.Count, standardDeviation);

    if (Math.Abs(histogramBinSize) < 1E-09)
      histogramBinSize = 1.0;

    return HistogramBuilder.Simple.Build(list, histogramBinSize);
  }
}
