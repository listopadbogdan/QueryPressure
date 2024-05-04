namespace QueryPressure.Metrics.Core;

public struct SimpleHistogram
{
  public string interval { get; }
  public int value { get; }

  public SimpleHistogram(string interval, int val)
  {
    this.interval = interval;
    this.value = val;
  }
}
