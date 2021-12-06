class Visualization4 {
    constructor(parentElement, shootingData, geoData, population, protestData, stateCapitals) {
        this.parentElement = parentElement;
        this.shootingData = shootingData;
        this.geoData = geoData;
        this.population = population;
        this.protestData = protestData;
        this.displayData = {};
        this.avgPopulationState = {}
        this.stateCapitals = stateCapitals
        this.initVis()
    }

    initVis(){
        let vis = this;

        vis.margin = { top: 10, right: 150, bottom: 10, left: 10 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;
        vis.viewpoint = {'width': 975, 'height': 610};
        vis.zoom = vis.width / vis.viewpoint.width;
        // If zoom makes height too big, scale based on height
        if (vis.viewpoint.height * vis.zoom > vis.height) {
            vis.zoom = vis.height / vis.viewpoint.height;
        }
        vis.width = vis.viewpoint.width * vis.zoom;
        vis.height = vis.viewpoint.height * vis.zoom;

        vis.path = d3.geoPath()
        vis.usa = topojson.feature(vis.geoData, vis.geoData.objects.states).features;

        // init drawing area
        vis.svg = d3
            .select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate (${vis.margin.left}, ${vis.margin.top})`);

        const {x:px,y:py} = document.querySelector("#" + vis.parentElement).getBoundingClientRect()
        const {x,y} = document.querySelector("#" + vis.parentElement + ">svg").getBoundingClientRect()
        vis.offsets = {x: x-px, y: y-py};

        vis.map = vis.svg.append("g") // group will contain all state paths
            .attr("class", "counties")
            .attr("transform", `scale(${vis.zoom})`)

        vis.counties = vis.map.selectAll(".county")
            .data(vis.usa)
            .enter().append("path")
            .attr('class', 'county')
            .attr("d", vis.path)

        // Append a linearGradient w a unique id
        vis.svgDefs = vis.svg.append('defs');
        vis.mapGradient = vis.svgDefs.append('linearGradient')
            .attr('id', 'mapGradient')
            .attr("gradientTransform", "rotate(90)");

        vis.colorScale = d3.scaleLinear()
            .range(["#f6af6a", "#683810"]);

        vis.legendDim = {height: 200, width: 20, padding: 10, paddingTop: 50}
        vis.legendScale = d3.scaleLinear()
            .range([vis.legendDim.height, 0]);
        vis.legendAxis = d3.axisRight()
            .scale(vis.legendScale)
            .tickSize(6)
            .ticks(8);

        this.population.forEach(row => {
            // console.log(row.NAME)
            var stateAvgpop = (row.POPESTIMATE2013 + row.POPESTIMATE2014 + row.POPESTIMATE2015 + row.POPESTIMATE2016
                + row.POPESTIMATE2017 + row.POPESTIMATE2018 + row.POPESTIMATE2019 + row.POPESTIMATE2020) / 8
            vis.avgPopulationState[row.NAME] = stateAvgpop
        })

        vis.finalProtestData = {};
        vis.protestData.features.forEach( (row) => {
            const {Region, Country} = row.properties;
            if (Country != "USA") return;
            if (!vis.finalProtestData[Region])
                vis.finalProtestData[Region] = 0
            vis.finalProtestData[Region] += 1
        });

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

        // Add a scale for bubble size
        const maxProtest = d3.max(Object.values(vis.finalProtestData));
        const minProtest = d3.min(Object.values(vis.finalProtestData));
        vis.scale = d3.scaleLinear()
            .domain([minProtest,maxProtest])
            .range([4, 20])  // Size in pixel

        // vis.updatedProtest = topojson.feature(vis.protestData.features, vis.protestData.features.objects.City).features
        let projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
        vis.dots = vis.svg.append("g") // group will contain all state paths
            .attr("class", "pins")
            .attr("transform", `scale(${vis.zoom})`);
        vis.dot = vis.dots.selectAll(".pin")
            .data(vis.stateCapitals)
            .enter().append("g", ".pin")
            .attr("transform", function(d) {
                const {latitude, longitude} = d;
                return "translate(" + (projection([longitude, latitude]) || [0,0]) + ")";
            });
        vis.dot.append("circle")
            .attr("r", d => d.rad = vis.scale(vis.finalProtestData[d.name] ?? 1))
            .attr("stroke-width", 3)
            .attr("fill-opacity", 0.4);
        vis.dot.append("text").attr("y",d=> -d.rad - 2).attr('text-anchor', 'middle').text(d=>d.description);
        // Add legend: circles
        var valuesToShow = [maxProtest*.01, maxProtest*.45, maxProtest]
        var xCircle = vis.width - 10
        var xLabel = vis.width + vis.scale(maxProtest) + 20
        var yCircle = vis.legendDim.height + vis.legendDim.paddingTop + vis.scale(maxProtest) + 30
        vis.legend = vis.svg
            .append("g")
            .attr("transform-origin", `${(xCircle + xLabel)/2}px ${yCircle - vis.scale(maxProtest)/2}px`)
            .attr("transform", `scale(${vis.zoom})`);
        vis.legend.selectAll("circle")
            .data(valuesToShow)
            .enter()
            .append("circle")
            .attr("cx", xCircle)
            .attr("cy", function(d){ return yCircle - vis.scale(d) } )
            .attr("r", function(d){ return vis.scale(d) })
            .style("fill", "none")
            .attr("stroke", "black");
        // Add legend: segments
        vis.legend.selectAll("line")
            .data(valuesToShow)
            .enter()
            .append("line")
            .attr('x1', function(d){ return xCircle + vis.scale(d)*0 } )
            .attr('x2', xLabel)
            .attr('y1', function(d){ return yCircle - vis.scale(d)*2 } )
            .attr('y2', function(d){ return yCircle - vis.scale(d)*2 } )
            .attr('stroke', 'black')
            .style('stroke-dasharray', ('2,2'))
        // Add legend: labels
        vis.legend.selectAll("text")
            .data(valuesToShow)
            .enter()
            .append("text")
            .attr('x', xLabel)
            .attr('y', function(d){ return yCircle - vis.scale(d)*2 } )
            .text( function(d){ return d } )
            .style("font-size", 18)
            .attr('alignment-baseline', 'middle')
        vis.wrangleData()
    }

    wrangleData() {
        let vis = this;

        vis.shootingData.forEach(row => {
            // console.log(abbrState(row.stateIncident, "name"))
            if (abbrState(row.stateIncident, "name") in vis.displayData) {
                // increment number of shootings everytime county is encountered
                vis.displayData[abbrState(row.stateIncident, "name")][0] += 1
            }
            else {
                vis.displayData[abbrState(row.stateIncident, "name")] = [1,]
            }
        })

        // Add counties with 0 shootings
        vis.usa.forEach(row => {
            if (!(row.properties.name in vis.displayData)) {
                vis.displayData[row.properties.name] = [0,]
            }
        })

        // console.log("display data", vis.displayData)

        var states = Object.keys(vis.displayData);

        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        // get the min and max of the number of shootings
        const sortedCounties = Object.keys(vis.displayData).sort(function(a,b){return vis.displayData[a]-vis.displayData[b]})
        const min = vis.displayData[sortedCounties[0]];
        const max = vis.displayData[sortedCounties[sortedCounties.length - 1]];
        vis.colorScale.domain(([min, max]));
        vis.legendScale.domain(vis.colorScale.domain());
        vis.mappedColors = [];
        d3.range(Math.floor(vis.legendDim.height)).forEach((i) => {
            const data = {
                color: vis.colorScale(vis.legendScale.invert(i)),
                offset: i / Math.floor(vis.legendDim.height) * 100
            }
            vis.mappedColors.push(data)
        });
        vis.mapGradient.selectAll('stop').data(vis.mappedColors).enter().append('stop')
            .attr('stop-color', d => d.color)
            .attr('offset', d => `${d.offset}%`);
        // make a rectangle for our legend and fill it based on a gradient
        vis.svg
            .append("rect")
            .attr('x', vis.width + vis.legendDim.padding)
            .attr('y', vis.legendDim.paddingTop)
            .attr('width', vis.legendDim.width)
            .attr('height', vis.legendDim.height)
            .attr("fill", "url(#mapGradient)");
        vis.legendGroup = vis.svg.append("g")
            .attr("transform", `translate(${vis.width + vis.legendDim.padding + vis.legendDim.width}, ${vis.legendDim.paddingTop})`)
            .attr("class", "x-axis axis")
            .call(vis.legendAxis);

        vis.counties
            .style("fill", function(d) { return vis.colorScale(vis.displayData[d.properties.name][0])})

        vis.counties
            .on('mouseover', function(event, d) {
                vis.tooltip
                    .style("opacity", 1)
                    .html(`Number of shootings: ${vis.displayData[d.properties.name][0]}`)
                    .style("top", event.offsetY + vis.offsets.y + "px")
                    .style("left", event.offsetX + vis.offsets.x + "px");
                d3.select(this)
                    .attr('stroke-width', '4px')
                    .attr('stroke', 'black')
                    .attr('fill', "#f5eaed");
            })
            .on('mouseout', function(event, d) {
                vis.tooltip.style("opacity", 0);
                d3.select(this)
                    .attr('stroke-width', '0px');
            });

        vis.dot
            .on('mouseover', function(event, d){
                vis.tooltip
                    .style("opacity", 1)
                    .html(`Number of Events: ${vis.finalProtestData[d.name]}`)
                    .style("top", event.offsetY + vis.offsets.y + "px")
                    .style("left", event.offsetX + vis.offsets.x + "px");
                d3.select(this)
                    .attr('stroke-width', '1px')
                    .attr("font-size", "25px")
                    .attr('stroke', 'black')
                    // .attr('fill', "#f5eaed")
            })
            .on('mouseout', function(event, d){
                vis.tooltip.style("opacity", 0);
                d3.select(this)
                    .attr("font-size", "20px")
                    .attr('stroke-width', '0px')
                    .attr('stroke', 'none')
            });
    }
}

function abbrState(input, to){

    var states = [
        ['Arizona', 'AZ'],
        ['Alabama', 'AL'],
        ['Alaska', 'AK'],
        ['Arkansas', 'AR'],
        ['California', 'CA'],
        ['Colorado', 'CO'],
        ['Connecticut', 'CT'],
        ['Delaware', 'DE'],
        ['Florida', 'FL'],
        ['Georgia', 'GA'],
        ['Hawaii', 'HI'],
        ['Idaho', 'ID'],
        ['Illinois', 'IL'],
        ['Indiana', 'IN'],
        ['Iowa', 'IA'],
        ['Kansas', 'KS'],
        ['Kentucky', 'KY'],
        ['Louisiana', 'LA'],
        ['Maine', 'ME'],
        ['Maryland', 'MD'],
        ['Massachusetts', 'MA'],
        ['Michigan', 'MI'],
        ['Minnesota', 'MN'],
        ['Mississippi', 'MS'],
        ['Missouri', 'MO'],
        ['Montana', 'MT'],
        ['Nebraska', 'NE'],
        ['Nevada', 'NV'],
        ['New Hampshire', 'NH'],
        ['New Jersey', 'NJ'],
        ['New Mexico', 'NM'],
        ['New York', 'NY'],
        ['North Carolina', 'NC'],
        ['North Dakota', 'ND'],
        ['Ohio', 'OH'],
        ['Oklahoma', 'OK'],
        ['Oregon', 'OR'],
        ['Pennsylvania', 'PA'],
        ['Rhode Island', 'RI'],
        ['South Carolina', 'SC'],
        ['South Dakota', 'SD'],
        ['Tennessee', 'TN'],
        ['Texas', 'TX'],
        ['Utah', 'UT'],
        ['Vermont', 'VT'],
        ['Virginia', 'VA'],
        ['Washington', 'WA'],
        ['West Virginia', 'WV'],
        ['Wisconsin', 'WI'],
        ['Wyoming', 'WY'],
    ];

    if (to == 'abbr'){
        input = input.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        for(i = 0; i < states.length; i++){
            if(states[i][0] == input){
                return(states[i][1]);
            }
        }
    } else if (to == 'name'){
        input = input.toUpperCase();
        for(i = 0; i < states.length; i++){
            if(states[i][1] == input){
                return(states[i][0]);
            }
        }
    }
}