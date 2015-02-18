var margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var parseDate = function(d) { return d3.time.format("%m/%d/%y").parse(d) };

var x = d3.scale.linear()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var color = d3.scale.category10();

var xAxis = d3.svg.axis()
    .scale(x)
    .ticks(30)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var line = d3.svg.line()
    .x(function(d) { return x(d.day); })
    .y(function(d) { return y(d.amount); });

var svg = d3.select(".graph-container").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("all_spending_2015_02_15_small.csv", function(error, data) {

  var spendData = d3.nest()
  .key(function(d) { return d.day })
  .rollup(function(leaves) { return d3.sum(leaves, function(d) { return d.amount; }) })
  .entries(data);

  color.domain(spendData.map(function(d) { return d.key; }));

  var amounts = spendData.map(function(day) {
    return {
      day: day.key,
      amount: day.values
    };
  });

  x.domain([0,31]);
  y.domain([0, d3.max(amounts, function(d) { return d.amount; })]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)

  svg.append("path")
      .datum(amounts)
      .attr("class", "line")
      .attr("d", line)
      .attr('fill', 'none')
      .style("stroke", function(d) { return color(d); });
});
