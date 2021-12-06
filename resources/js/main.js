// load data using promises
let promises = [d3.csv("resources/data/MPVDatasetDownload.csv"),
  // d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-albers-10m.json"),
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json"),
  d3.csv("resources/data/juvenile_arrests.csv"),
  d3.csv("resources/data/population_per_state.csv"),
  d3.json("resources/data/global_protests.json"),
  d3.csv("resources/data/us-state-capitals.csv")];

console.log("promises are", promises);

let parseDate = d3.timeParse("%m/%d/%y");

let HeatMapVis;
let BarVis;
let map;
let stackedbar;
let typewriter;

Promise.all(promises)
  .then(function (data) {
    initMainPage(data);
  })
  .catch(function (err) {
    console.log(err);
  });

function initMainPage(data) {
  let parsed_data = data[0].map((row) => {
    row['dateIncident'] = parseDate(row['dateIncident'])
    return row;

  });

  let years = {
    2021: new Array(12).fill(0),
    2020: new Array(12).fill(0),
    2019: new Array(12).fill(0),
    2018: new Array(12).fill(0),
    2017: new Array(12).fill(0),
    2016: new Array(12).fill(0),
    2015: new Array(12).fill(0),
    2014: new Array(12).fill(0),
    2013: new Array(12).fill(0),
  };

  // log data
  // console.log("check out the data", parsed_data);

  parsed_data.map((row) => {
    let year = row['dateIncident'].getFullYear();
    let month = row['dateIncident'].getMonth();

    years[year][month] += 1;

  })

  let final_data = []

  for (const property in years) {
    years[property].forEach((d,i) => {
      final_data.push({
        year: property,
        month: i + 1,
        value: d
      })
    })
  }

  HeatMapVis = new HeatVis("vis1PlaceHolder", final_data);
  BarVis = new BarchartVis("vis3PlaceHolder", parsed_data);
  stackedbar = new StackedBar("stackedbar", data[2])

  // init table
  visualization2 = new Visualization2("vis2PlaceHolder", [data[0]]);
  // visualization5 = new Visualization5("vis5PlaceHolder", [data[0]]);

  map = new Visualization4("map", data[0], data[1], data[3], data[4], data[5]);

  typewriter = new Typewriter('#typewriter', {
    loop: true,
    delay: 0.1,
    deleteSpeed: 0,
  });
  const victims = data[0];
  let count = 0;
  victims.forEach((elem) => {
      if (elem.victimRace === "Black") {
        const nameStr = count++ % 2 === 0 ? `${elem.victimName}.` : `<span style="color: orange;">${elem.victimName}.</span>`;
        typewriter
            .typeString(`<strong>${nameStr} </strong>`)
            .pauseFor(0);
        if (count && count % 50 === 0) {
          typewriter.pauseFor(2000).callFunction(() => {
            document.querySelector("span.Typewriter__wrapper").innerHTML = '';
          });
        } else if (count && count % 25 === 0) {
          typewriter
              .typeString('<br><strong><span style="color: black; font-size: 4rem; font-weight: bolder">BLACK LIVES MATTER.</span></strong><br>')
              .pauseFor(0);
        }
      }
    });

}

function buttonclicked() {
  typewriter.start();
}
let selectedCategory = d3.select("#categorySelector").property("value");

function categoryChange() {
  console.log("selection change")
  selectedCategory = d3.select("#categorySelector").property("value");
  stackedbar.wrangleData();
}

