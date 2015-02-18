var parseDate = d3.time.format("%m/%d/%y").parse;

function updateDate(data) {
  return data.map(function(d){
    return {
      month: +d.key,
      days: d.values.map(function(v) {
        return {
          day: v.key,
          amount: v.values
        };
      })
    }
  })
}

function runningSum(data) {
  var maxY = 0;
  for(var i in data) {
    for(var j in data[i].days) {
      if (j > 0) {
        data[i].days[j].amount += data[i].days[j-1].amount
        maxY = data[i].days[j].amount > maxY ? data[i].days[j].amount : maxY;
      }
    }
  }
  return { data: data, max: maxY };
}

var margin = {top: 20, right: 40, bottom: 30, left: 50},
    width = 1200,
    height = 800;

$('.graph-container').css({'height': height + margin.top, 'width': width});

// CREATE X & Y AXIS
var x = d3.scale.linear()
  .range([0, width - margin.left - margin.right]);

var y = d3.scale.linear()
  .range([height - margin.top - margin.bottom, 0]);

var xAxis = d3.svg.axis()
  .scale(x)
  .ticks(31)
  .orient("bottom");

var yAxis = d3.svg.axis()
  .scale(y)
  .ticks(8)
  .orient("left");

var line = d3.svg.line()
  .interpolate('basis')
  .x(function(d) { return x(d.day); })
  .y(function(d) { return y(d.amount); });

var svg = d3.select(".graph-container").append("svg")
  .attr("width", width)
  .attr("height", height + 50)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var color = d3.scale.category20();

// IMPORT DATA
d3.csv("all_spending.csv", function(error, data) {

  data.forEach(function(d) {
    d.date = parseDate(d.date);
  })

  var spendData = d3.nest()
    .key(function(d) { return d.date.getYear() + 1900; })
    .key(function(d) { return d.date.getMonth() + 1; })
    .key(function(d) { return d.date.getDate(); })
    .rollup(function(leaves) {
      return d3.sum(leaves, function(d) { return d.amount; })
    })
    .entries(data);

  var select  = d3.selectAll("#year-select").on("change", function() { change(spendData) }),
      options = select.selectAll('option').data(spendData.map(function(d) { return {year: d.key} }));

  // Enter selection
  options.enter().append("option")
  .attr('value', function(d) { return d.year})
  .text(function(d) { return d.year; });
  var thisYear = d3.select(options[0][1]).attr('value');

  var data = spendData.filter(function(d) { return d.key == thisYear })[0].values
  var parseDataMax = runningSum(updateDate(data));
  var amounts = parseDataMax.data;
  var maxY    = parseDataMax.max

  color.domain(amounts.map(function(d){return d.month}));
  x.domain([1,31]);
  y.domain([0, maxY]);

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height - margin.top - margin.bottom) + ")")
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", function(d) { return "rotate(-65)" });

  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)

  var month = svg.selectAll(".month")
    .data(amounts, function(d) { return d.month; })
    .enter().append("g")
    .attr("class", "month")
    .on('mouseover', function(d) {
      hoverText.style("display", null);
      hoverText.select('text').text(d.month);
      hoverText.attr("transform", "translate(50,300)");

      d3.select(this).attr('stroke-width', '3px');
    })
    .on('mouseout', function(d) {
      hoverText.style("display", 'none');
      d3.select(this).attr('stroke-width', '2px');
    });

  var hoverText = month.append('g')
  .attr('class', 'hover-text')
  .style('display', 'none');

  hoverText.append("circle")
    .attr('r', 5)
    .attr('fill', 'red');

  hoverText.append("text")
    .attr('x', 28)
    .attr('y', -10)
    .attr('text-anchor', 'middle');

  month.append("path")
    .attr("class", "line")
    .attr('fill', 'none')
    .attr("d", function(d) { return line(d.days); })
    .style("stroke", function(d) { return color(d.month); });
});

function change(data) {
  var thisYear     = event.target.value;
  var data         = data.filter(function(d) { return d.key == thisYear })[0].values
  var parseDataMax = runningSum(updateDate(data));
  var amounts      = parseDataMax.data;
  var maxY         = parseDataMax.max

  color.domain(amounts.map(function(d){return d.month}));
  y.domain([0, maxY]);

  var svg = d3.select('.graph-container').transition();
  var month = d3.select('.graph-container').selectAll(".line").data(amounts, function(d) { return d.month; }).attr('class', 'line');

  svg.select(".y.axis")
    .duration(750)
    .call(yAxis);

  month.transition()
    .duration(750)
    .attr("d", function(d) { return line(d.days); })
    .style("stroke", function(d) { return color(d.month); });

}
