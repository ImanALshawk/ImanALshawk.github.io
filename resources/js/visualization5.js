class Visualization5 {
    constructor(parentElement, dataSet) {
        this.parentElement = parentElement;
        this.data = dataSet;
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 10, right: 10, bottom: 10, left: 10};

        vis.width =
            document.getElementById(vis.parentElement).getBoundingClientRect().width -
            vis.margin.left -
            vis.margin.right;
        vis.height =
            document.getElementById(vis.parentElement).getBoundingClientRect()
                .height -
            vis.margin.top -
            vis.margin.bottom;

        // init drawing area
        vis.svg = d3
            .select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate (${vis.margin.left}, ${vis.margin.top})`);

        // let blackText = svg.append("text")
        //     .attr("x", 20)
        //     .attr("y", 80);
        //
        // let livesText = svg.append("text")
        //     .attr("x", 20)
        //     .attr("y", 80);
        //
        // let matterText = svg.append("text")
        //     .attr("x", 20)
        //     .attr("y", 80);

        // function drawBLMText() {
        //
        // }

        let wordList = [];
        // vis.data.forEach( (d) => {
        //     d.forEach( (elem, i) => {
        //         if (elem.victimRace === "Black") {
        //             wordList.push(elem.victimName)
        //         }
        //     })
        // })

        vis.data.forEach( (d) => {
            d.forEach( (elem, i) => {
                if (elem.victimRace === "Black") {
                    wordList.push({word: elem.victimName, size: 10})
                }
            })
        })
        wordList.push({word: "BLACK LIVES MATTER", size: 80})

        //console.log(wordList)

        var layout = d3.layout.cloud()
            .size([vis.width, vis.height])
            .words(wordList.map(function(d) { return {text: d.word, size:d.size}; }))
            //.words(wordList.map(function(d) { return {text: d}; }))
            .padding(1)        //space between words
            .rotate(function() { return 0; })
            .fontSize(function(d) { return d.size; })
            //.fontSize(20)      // font size of words
            .on("end", draw);

       layout.start();

        function draw(words) {
            //console.log(wordList)
            let gtemp = vis.svg
                .append("g")
                .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
                .selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", function(d) { return d.size; })
               // .style("font-size", 20)
                .style("fill", "#69b3a2")
                .attr("text-anchor", "middle")
                .style("font-family", "Impact")
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + 0 + ")";
                })
                .text(function(d) { return d.text; });
            // gtemp.append("text")
            //     .text("hi")
        }
    }

}
