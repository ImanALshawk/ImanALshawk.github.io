class StackedBar {

    constructor(parentElement, offenseData) {
        this.parentElement = parentElement;
        this.offenseData = offenseData;
        this.displayData = [];


        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 10, right: 10, bottom: 130, left: 60};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        vis.x = d3.scaleBand()
            .rangeRound([0, vis.width])
            .paddingInner(0.05)
            .domain(d3.range(0, 12));

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        vis.yAxis = d3.axisLeft()
            .ticks(25)
            .scale(vis.y);

        vis.xGroup = vis.svg.append("g")
            .attr("transform", "translate(0," + (vis.height) + ")")
            .attr("class", "x-axis axis")
            .call(vis.xAxis);

        vis.yGroup = vis.svg.append("g")
            .attr("class", "y-axis axis")
            .call(vis.yAxis);

        vis.colorScale = d3.scaleOrdinal()
            .domain(["black", "white"])
            .range(["green", "red"]);

        // Making the legend
        var legend = vis.svg.append("g")
            .attr("font-size", 17)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(["white", "black"])
            .enter().append("g")
            .attr("transform", function(d, i) { return "translate(0," + i * 35 + ")"; });

        legend.append("rect")
            .attr("x", vis.width - 19)
            .attr("width", 25)
            .attr("height", 25)
            .attr("fill", d=> {
                if (d == "white") {
                    return "red";
                }
                else {
                    return "green"
                }
            });

        legend.append("text")
            .attr("x", vis.width - 24)
            .attr("y", 10)
            .attr("dy", "0.32em")
            .text(function(d) { return d; });

        // Append tooltip
        vis.tooltip = d3.select("#" + vis.parentElement).append("svg")
            .attr('class', "tooltip")
            .attr('id', 'stackedTooltip');

        vis.barGraph = vis.svg.append("g")

        vis.wrangleData()
    }

    wrangleData() {
        let vis = this;

        vis.offenseData.forEach(row => {

            if (!(vis.displayData[row.Offense])) {
                vis.displayData[row.Offense] = {
                    "white": 0,
                    "black": 0,
                    "american_indian": 0,
                    "asian": 0
                }
            } else {
                // get rid of NA values
                if (row[selectedCategory] != "NA") {
                    vis.displayData[row.Offense][row.Category] += parseInt(row[selectedCategory]);
                }
            }
        })

        var keys = Object.keys(vis.displayData);

        // get rid of "ALl crimes"
        keys = keys.slice(1)

        vis.finalDisplayData = []

        keys.forEach((key, index) => {
            const crime = {}
            crime["crime"] = key

            const races = ["white", "black"]

            races.forEach((race => {
                crime[race] = vis.displayData[key][race]
            }))

            // add the sum of arrests for both races
            crime["total"] = vis.displayData[key]["white"] + vis.displayData[key]["black"]

            if (crime["total"] != 0) {
                vis.finalDisplayData.push(crime)
            }

        });

        // sort the data by the total number of arrests
        vis.finalDisplayData.sort(function (a, b) {
            return b.total - a.total;
        });

        console.log(vis.finalDisplayData)
        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        vis.x.domain(vis.finalDisplayData.map((d) => {
            return d.crime
        }))

        vis.svg.select(".x-axis").call(vis.xAxis)
            .selectAll("text")
            .text(function(d){
                return d.crime;
            })
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function (d) {
                return "rotate(-45)"
            });

        vis.xGroup
            .selectAll("text")
            .attr("transform", "rotate(-40)")

        vis.y.domain([0, vis.finalDisplayData[0].total])

        let stack = d3.stack().keys(["black", "white"]);
        vis.stackedData = stack(vis.finalDisplayData);

        vis.bars = vis.barGraph.selectAll("g")
            .data(vis.stackedData);
        vis.bars = vis.bars.enter().append("g")
            .merge(vis.bars)
            .attr("fill", (d) => vis.colorScale(d.key));
        vis.bar = vis.bars.selectAll("rect")
            .data((d) => d);
        vis.bar = vis.bar
            .enter().append("rect")
            .merge(vis.bar)
            .attr("x", (d) => vis.x(d.data.crime))
            .attr("y", (d) => vis.y(d[1]))
            .attr("height", (d )=> vis.y(d[0]) - vis.y(d[1]))
            .attr("width", vis.x.bandwidth());
        vis.bar
            .on('mouseover', function(event, d){
                var displayNum;
                var race;

                if (d[0] == 0) {
                    race = "black"
                    displayNum = d[1]
                }
                else {
                    race = "white"
                    displayNum = d[1] - d[0]
                }
                console.log(event.pageY, event.pageX)
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                         <div style="...">
                             <h1>hi</h1>
                             <h3>Number of Arrests: ${displayNum}<h3>
                         </div>`);

                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black');
            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '0px')

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });


        vis.svg.select("g.x-axis")
            .transition()
            .duration(1000)
            .call(vis.xAxis);

        vis.svg.select("g.y-axis")
            .transition()
            .duration(1000)
            .call(vis.yAxis);

        vis.bars.exit().remove();
        vis.bar.exit().remove();

    }
}