const repo = 'olliemath/pushups';
const data = [];

const svg = d3.select("#chart");
const width = +svg.attr("width");
const height = +svg.attr("height");
const margin = { top: 20, right: 30, bottom: 40, left: 50 };

const x = d3.scalePoint().padding(0.5).range([margin.left, width - margin.right]);
const y = d3.scaleLinear().range([height - margin.bottom, margin.top]);

const xAxis = svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`);
const yAxis = svg.append("g").attr("transform", `translate(${margin.left},0)`);

const actualLine = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.pushups));

const path = svg.append("path").attr("class", "line");
const tooltip = d3.select("#tooltip");

function updateChart() {
    x.domain(data.map(d => d.date));
    y.domain([0, d3.max(data, d => d.pushups) || 10]);

    xAxis.call(d3.axisBottom(x)).selectAll("text").attr("class", "axis-label");
    yAxis.call(d3.axisLeft(y)).selectAll("text").attr("class", "axis-label");

    path.datum(data)
        .transition()
        .duration(500)
        .attr("d", actualLine);

    const dots = svg.selectAll(".dot").data(data, d => d.date);

    dots.enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.pushups))
        .attr("r", 5)
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`)
                .html(`<strong>${d.date}</strong>: ${d.pushups} pushups`);
        })
        .on("mouseout", () => tooltip.style("display", "none"))
        .merge(dots)
        .transition()
        .duration(500)
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.pushups))
        .attr("r", 5);

    dots.exit().remove();
}

function fetchData() {
    fetch(`https://raw.githubusercontent.com/${repo}/refs/heads/main/data.json`)
    .then(res => res.json())
    .then(dataFile => {
        data.push(...inflateData(dataFile.completed));
        data.sort((a, b) => a.date.localeCompare(b.date));
        plotBurndown(data, 1000);
        plotPrediction(data);
        updateChart();
    }).catch(err => console.log(err));
}

function inflateData(data) {
    data.unshift({date: "2024-12-31", pushups: 0});
    data.sort((a, b) => a.date.localeCompare(b.date));

    // fill in any gaps
    const lookup = new Map()
    for (let row of data) {
        lookup.set(row.date, row.pushups);
    }

    current = data[0].date;
    last = data[data.length - 1].date;
    while (current < last) {
        current = shiftDay(current, 1)
        if (!lookup.has(current)) {
            lookup.set(current, 0);
        }
    }

    data = [];
    lookup.forEach((value, key) => {
        data.push({date: key, pushups: value});
    })
    data.sort((a, b) => a.date.localeCompare(b.date));

    // use running total
    for (let ix in data) {
        if (ix > 0) {
            data[ix].pushups += data[ix - 1].pushups;
        }
    }

    return data
}

function plotBurndown(data, target) {
    /// Plot the required burndown for our exercise plan
    let burnRate = target / 365;
    let dates = buildOutDates(data, 30);

    burn = [];
    for (let ix in dates) {
        burn.push({date: data[ix], pushups: burnRate * ix});
    }
    // plt.plot(dates, burn, color="gray", linestyle="dashed", label="burndown")
    return burn
}

function plotPrediction(data) {
    /// Plot how we will do by the end of the year at current rates
    let days = data.length - 1;
    let total = data[data.length - 1].pushups;
    let perDay = total / days;

    let dates = buildOutDates(data, 30);
    let prediction = [];
    for (let ix in dates) {
        prediction.push({date: dates[ix], pushups: perDay * ix});
    }
    // plt.plot(dates, values, color="red", linestyle="dotted", label="prediction")
    return prediction
}

function buildOutDates(data, horizon) {
    dates = data.map((row) => row.date);
    for (let ix=0; ix<horizon; ix++) {
        let next = shiftDay(dates[0], ix + 1);
        if (next >= "2026-01-01") {
            break;
        }
        dates.push(next);
    }
    return dates
}

function shiftDay(dayString, delta) {
    day = new Date(dayString)
    day.setDate(day.getDate() + delta)
    return day.toISOString().split("T")[0]
}

fetchData();
