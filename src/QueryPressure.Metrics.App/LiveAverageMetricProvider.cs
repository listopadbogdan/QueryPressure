using Perfolizer.Horology;
using QueryPressure.App.Interfaces;
using QueryPressure.Core.Interfaces;
using QueryPressure.Metrics.Core;

namespace QueryPressure.Metrics.App;

public class LiveAverageMetricProvider : ILiveMetricProvider
{
  private int _count;
  private long _totalNanoseconds;
  private long _deltaNanoseconds;
  private int _deltaCount;
  private int _rps;

  public Task OnQueryExecutedAsync(ExecutionResult result, CancellationToken cancellationToken)
  {
    Interlocked.Add(ref _totalNanoseconds, (long)result.Duration.TotalNanoseconds);
    Interlocked.Add(ref _deltaNanoseconds, (long)result.Duration.TotalNanoseconds);
    Interlocked.Increment(ref _count);
    Interlocked.Increment(ref _deltaCount);
    if (_deltaNanoseconds >= 1000000000)
    {
      Interlocked.Exchange(ref _rps, _deltaCount);
      Interlocked.Exchange(ref _deltaNanoseconds, 0);
      Interlocked.Exchange(ref _deltaCount, 0);
    }
    return Task.CompletedTask;
  }
  public IEnumerable<IMetric> GetMetrics()
  {
    yield return new SimpleMetric("live-average",
      _count == 0
        ? TimeInterval.FromNanoseconds(0)
        : TimeInterval.FromNanoseconds((double)_totalNanoseconds / _count));
    yield return new SimpleMetric("live-request-count", _count);

    yield return new SimpleMetric("live-rps", _rps);
    yield return new SimpleMetric("live-rps-avg", (double)_count/_totalNanoseconds*1000000000);
  }
}
