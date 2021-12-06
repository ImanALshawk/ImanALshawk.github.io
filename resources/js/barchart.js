

class BarchartVis {
    constructor(parentElement, data) {

        this.displayData = data;
        this.parentElement = parentElement;

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 80, right: 25, bottom: 30, left: 40};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;


        vis.svg = d3.select("#" + this.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.x = d3.scaleBand()
            .rangeRound([0, vis.width])
            .paddingInner(0.1);

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.yAxisGroup = vis.svg.append("g")
            .attr("class", "y-axis axis");

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        vis.xAxisGroup = vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0,"+vis.height+")");

        // Range
        vis.sliderRange = d3
            .sliderBottom()
            .min(0)
            .max(100)
            .default([13, 19])
            .width(300)
            .ticks(5)
            .fill('#e67e22')
            .on('onchange', val => {
                d3.select('p#value-range').text(val.map(d3.format('.0f')).join('-'));
                vis.wrangleData(val)
            });

        vis.gRange = d3.select('div#slider-range')
            .append('svg')
            .attr('width', 500)
            .attr('height', 100)
            .append('g')
            .attr('transform', 'translate(30,30)');

        vis.gRange.call(vis.sliderRange);

        d3.select('p#value-range').text(
            vis.sliderRange
                .value()
                .map(d3.format('.0f'))
                .join('-')
        );

        vis.wrangleData([13,19]);

    }

    wrangleData(val) {
        let vis = this;

        let races = {
            'Black': [],
            'White': [],
            'Hispanic': [],
            'Asian': [],
            'Native American': [],
            'Pacific Islander': [],
            'Unknown race': [],
        };

        vis.new_data = vis.displayData.filter((row) =>{
            return row['victimAge'] > val[0] && row['victimAge'] < val[1]
        })

        vis.new_data.map((row) => {
            let race = row['victimRace'];

            races[race].push(row)
        })

        vis.final_data = [];

        for (const property in races) {

            vis.final_data.push({
                race: property,
                value: races[property].length,
            })

        }

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.x.domain(vis.final_data.map( d => d.race ));
        vis.y.domain([0, d3.max(vis.final_data, d=> d.value)]);

        vis.svg.select(".y-axis")
            .call(vis.yAxis);

        vis.svg.select(".x-axis")
            .call(vis.xAxis);

        vis.rect = vis.svg.selectAll("rect")
            .data(vis.final_data, d=>d);

        // Enter (initialize the newly added elements)
        vis.rect.enter().append("rect")
            .attr("class", "bar")
            .attr("fill", "#91532c")

            // Enter and Update (set the dynamic properties of the elements)
            .merge(vis.rect)
            .attr("y", d=> vis.y(0))
            .attr("height", 0)
            .attr("x", d=> vis.x(d.race))
            .attr("width", vis.x.bandwidth())
            .attr("y", d=> vis.y(d.value))
            .attr("height", d=> vis.height - vis.y(d.value));

        // Exit
        vis.rect.exit().remove();

    }
}
