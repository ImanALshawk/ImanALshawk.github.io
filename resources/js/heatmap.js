

class HeatVis {
    constructor(parentElement, data) {

        this.displayData = data;
        this.parentElement = parentElement;

        this.initVis();
    }

    initVis() {
        let vis = this;

        let monthName = ["-", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

        vis.margin = {top: 30, right: 140, bottom: 30, left: 30};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + this.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.years = d3.map(vis.displayData, (d) => d['year'])
        vis.months = d3.map(vis.displayData, (d) => d['month'])
        vis.x = d3.scaleBand()
            .range([0, vis.width])
            .domain(vis.years)
            .padding(0.05);
        vis.y = d3.scaleBand()
            .range([0, vis.height])
            .domain(vis.months)
            .padding(0.05);
        vis.color = d3.scaleSequential()
            .interpolator(d3.interpolateYlOrRd)
            .domain([40, d3.max(vis.displayData, function (d) {
                return d.value;
            })]);
        const legendDim = {height: 200, width: 20, padding: 10}
        vis.legendScale = d3.scaleLinear()
            .range([legendDim.height, 0])
            .domain(vis.color.domain());
        vis.legendAxis = d3.axisRight()
            .scale(vis.legendScale)
            .tickSize(6)
            .ticks(8);
        vis.mappedColors = []
        d3.range(Math.floor(legendDim.height)).forEach((i) => {
            const data = {
                color: vis.color(vis.legendScale.invert(i)),
                offset: i / Math.floor(legendDim.height) * 100
            }
            vis.mappedColors.push(data)
        });
        vis.svgDefs = vis.svg.append('defs');
        vis.mainGradient = vis.svgDefs.append('linearGradient')
            .attr('id', 'mainGradient')
            .attr("gradientTransform", "rotate(90)");
        vis.mainGradient.selectAll('stop').data(vis.mappedColors).enter().append('stop')
            .attr('stop-color', d => d.color)
            .attr('offset', d => `${d.offset}%`);
        // make a rectangle for our legend and fill it based on a gradient
        vis.svg
            .append("rect")
            .attr('x', vis.width + legendDim.padding)
            .attr('y', 0)
            .attr('width', legendDim.width)
            .attr('height', legendDim.height)
            .attr("fill", "url(#mainGradient)");
        vis.legendGroup = vis.svg.append("g")
            .attr("transform", `translate(${vis.width + legendDim.padding + legendDim.width}, 0)`)
            .attr("class", "y-axis axis")
            .call(vis.legendAxis);

        vis.svg.append("g")
            .style("font-size", 15)
            .call(d3.axisTop(vis.x).tickSize(0))
            .select(".domain").remove()
        vis.svg.append("g")
            .style("font-size", 15)
            .call(d3.axisLeft(vis.y).tickSize(0))
            .select(".domain").remove()
        vis.tooltip = d3.select("#" + vis.parentElement)
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("margin", "5px")
            .style("position", "absolute")

        vis.mouseover = function (evt, data) {
            d3.select(this)
                .style("stroke", "black")
                .style("opacity", 1)
            const unavail = data.year === '2021' && data.month >= 11
            const endText = unavail ? "<br>Data unavailable" :  "<br>Police shootings " + data.value
            vis.tooltip
                .style("opacity", 1)
                .style("top", evt.offsetY + "px")
                .style("left", evt.offsetX + "px")
                .html(monthName[data.month] +
                    " " + data.year +
                    endText)
        }
        vis.mouseleave = function (evt, data) {
            if (data.year === '2020' && data.month === 5) {
                d3.select(this)
                    .style("stroke", "black")
                    .style("opacity", 1)
            } else {
                vis.tooltip
                    .style("opacity", 0)
                d3.select(this)
                    .style("stroke", "none")
                    .style("opacity", 0.8)
            }
        }

        vis.svg.selectAll()
            .data(vis.displayData, (d) => d['year'] + ':' + d['month'])
            .enter()
            .append("rect")
            .attr("x", (d) => vis.x(d['year']))
            .attr("y", (d) => vis.y(d['month']))
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("width", vis.x.bandwidth())
            .attr("height", vis.y.bandwidth())
            .style("fill", function (d) {
                if (d.year === '2021' && d.month >= 11)
                    return 'grey'
                return vis.color(d.value)
            })
            .style("stroke-width", 4)
            .style("stroke", function (d) {
                if (d.year === '2020' && d.month === 5)
                    return 'black'
                return "none"
            })
            .style("opacity", function (d) {
                if (d.year === '2020' && d.month === 5)
                    return 1
                return 0.8
            })
            .on("mouseover", vis.mouseover)
            .on("mouseleave", vis.mouseleave)

        vis.svg.append("text")
            .attr("class", "y label")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - vis.margin.left - 8.5)
            .attr("x",0 - (vis.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Month");

    }
}
