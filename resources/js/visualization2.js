class Visualization2 {
  constructor(parentElement, dataSet) {
    this.parentElement = parentElement;
    this.data = dataSet;
    this.initVis();
  }

  initVis() {
    let vis = this;

    vis.margin = { top: 10, right: 10, bottom: 10, left: 10 };

    const units = "People";
    const formatNumber = d3.format(",.0f"), // zero decimal places
      format = function (d) {
        return formatNumber(d) + " " + units;
      },
      color = d3.scaleOrdinal(d3.schemeCategory10);
    console.log(document.getElementById(vis.parentElement).getBoundingClientRect());
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

    let sankey = d3
      .sankey()
      .nodeWidth(30)
      .nodePadding(15)
      .size([vis.width, vis.height]);
    vis.path = sankey.link();

    this.dictionaryData = [];
    let levels_gender = [];
    let levels_race = [];
    let levels_armedStatus = [];

    this.data.forEach((d) => {
      d.forEach((elem, i) => {
        this.dictionaryData[["All", elem.victimGender]]
          ? (this.dictionaryData[["All", elem.victimGender]].value += 1)
          : (this.dictionaryData[["All", elem.victimGender]] = { value: 1 });

        this.dictionaryData[[elem.victimGender, elem.victimRace]]
          ? (this.dictionaryData[
              [elem.victimGender, elem.victimRace]
            ].value += 1)
          : (this.dictionaryData[[elem.victimGender, elem.victimRace]] = {
              value: 1,
            });

        this.dictionaryData[[elem.victimRace, elem.armedStatus]]
          ? (this.dictionaryData[
              [elem.victimRace, elem.armedStatus]
            ].value += 1)
          : (this.dictionaryData[[elem.victimRace, elem.armedStatus]] = {
              value: 1,
            });

        levels_gender[elem.victimGender]
          ? (levels_gender[elem.victimGender].value += 1)
          : (levels_gender[elem.victimGender] = { value: 1 });

        levels_race[elem.victimRace]
          ? (levels_race[elem.victimRace].value += 1)
          : (levels_race[elem.victimRace] = { value: 1 });

        levels_armedStatus[elem.armedStatus]
          ? (levels_armedStatus[elem.armedStatus].value += 1)
          : (levels_armedStatus[elem.armedStatus] = { value: 1 });
      });
    });
    let levels_allData = [];
    let source_data = [];
    levels_allData.push(levels_gender, levels_race, levels_armedStatus);

    let dataForSankey = [];
    Object.entries(this.dictionaryData).forEach(([key, value]) => {
      let source_target = key.split(",");
      //  Remove blanks
      if (!source_target[0] || !source_target[1]) return;
      dataForSankey.push([source_target[0], source_target[1], value.value]);
    });

    let graph_info = { nodes: [], links: [] };
    dataForSankey.forEach(function (d) {
      if (d[0] === d[1]) return;
      graph_info.nodes.push({ name: d[0] });
      graph_info.nodes.push({ name: d[1] });
      graph_info.links.push({ source: d[0], target: d[1], value: d[2] });
    });

    graph_info.nodes = Array.from(
      d3.group(graph_info.nodes, (d) => d.name).keys()
    );

    graph_info.nodes.forEach( (d, i) => {
      source_data.push(d)
    })
    //console.log(source_data)

    graph_info.links.forEach(function (d, i) {
      graph_info.links[i].source = graph_info.nodes.indexOf(
        graph_info.links[i].source
      );
      graph_info.links[i].target = graph_info.nodes.indexOf(
        graph_info.links[i].target
      );
    });
    graph_info.nodes.forEach(function (d, i) {
      graph_info.nodes[i] = { name: d };
    });

    sankey.nodes(graph_info.nodes).links(graph_info.links).layout(20);

    // add in the nodes
    vis.node = vis.svg
      .append("g")
      .selectAll(".node")
      .data(graph_info.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      }).call(d3.drag()
            .subject(d => d)
            .on('start', function () { this.parentNode.appendChild(this); })
            .on('drag', dragmove));

    // add the rectangles for the nodes
    vis.node
      .append("rect")
      .attr("height", function (d) {
        return d.dy;
      })
      .attr("width", sankey.nodeWidth())
      .style("fill", function (d) {
        return (d.color = color(d.name.replace(/ .*/, "")));
      })
      .style("stroke", function (d) {
        return d3.rgb(d.color).darker(1);
      })
      .attr("stroke-width", 1.5)
      .append("title")
      .text(function (d) {
        return d.name + "\n" + format(d.value);
      });

    // add in the title for the nodes
    vis.node
      .append("text")
      .attr("x", -6)
      .attr("y", function (d) {
        return d.dy / 2;
      })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function (d) {
        return d.name;
      })
        .style("font-weight", "bold")
        .style("font-size", "0.8rem")
      .filter(function (d) {
        return d.x < vis.width / 2;
      })
      .attr("x", 6 + sankey.nodeWidth())
      .attr("text-anchor", "start");

    // add in the links
    vis.link = vis.svg
        .append("g")
        .selectAll(".link")
        .data(graph_info.links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", vis.path)
        .style("stroke", d => color(d.source.name.replace(/ .*/, "")))
        .style("stroke-width", (d) => Math.max(1, d.dy))
        .sort(function (a, b) {
          return b.dy - a.dy;
        });

    // add the link titles
    vis.link.append("title").text((d) => `${d.source.name} → ${d.target.name}\n${format(d.value)}`);

    function dragmove(evt, d) {
      if (!vis.link) return;
      d.x = Math.max(0, Math.min(vis.width - d.dx, evt.x));
      d.y = Math.max(0, Math.min(vis.height - d.dy, evt.y));
      d3.select(this).attr("transform",
          "translate(" + d.x + "," + d.y + ")");
      sankey.relayout();
      vis.link.attr("d", vis.path);
    }
  }
}
