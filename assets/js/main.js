// Slider and highchart init are run at the same time.
// Once the sliders, highcharts and the wasm module is setup we run our model!
// -> Check sliders
// -> Update model params
// -> run
// -> Update charts
var t_max = 10 * 360.0;

// ---------------------------------------------------------------------------- //
// Model
// ---------------------------------------------------------------------------- //
var wasm_init = false;
Module['onRuntimeInitialized'] = function () {
  console.log("model wasm loaded");
  wasm_init = true;
}

//GLOBAL model objects i.e. a instance of our cpp model class and for 
// the data, solver and initial values.
var data;

/* Run load function on load of website sometime wasm loads in strange behaviour or
is not fully loaded on the 'load' event so we make an additional check for that */
window.addEventListener("load", setup_model);
function setup_model() {
  if (!wasm_init || !slider_init || !highchart_init) {
    setTimeout(setup_model, 10);
    return;
  }
  on_click_inf(undefined, spezial["k_t"], 6*360, 200, -0.8);     // adds a lockdown event
  model_run();
}
function model_run() {
  //Create model instance
  var model = new Module.Model();

  // Get parameters from global dict (see below)
  // than update the model params uses the setters
  // from the model wasm
  // e.g models["foo"] = bar; -> model.set_foo(bar)
  var params = {}
  for (key in main_parameters) {
//    if (key == R) continue; // ? we do not set R
    params[key] = parseFloat(main_parameters[key]["value"])
  }
  for (key in season_parameters) {
    params[key] = parseFloat(season_parameters[key]["value"])
  }
  for (key in feedback_parameters) {
    params[key] = parseFloat(feedback_parameters[key]["value"])
  }
  for (key in spezial) {
    params[key] = spezial[key]["cpp"]
  }
  model = update_model_params(model, params);

  // Create initial values for the model
  // also from a global dict (see below)
  var init = {}
  for (key in initials) {
    init[key] = parseFloat(initials[key]["value"])
  }

  // Run the model using the 
  // initial values
  var solver = new Module.Solver(model);
  solver.set_dt(1.);
  solver.run(
    init["SS"], init["SI"], init["SR"],
    init["IS"], init["II"], init["IR"],
    init["RS"], init["RI"], init["RR"],
    t_max
  );

  // Save data to global object
  var dat = solver.get_data();
  save_data(model, dat);

  // Update highcharts plot
  update_highcharts_series();
}


function update_model_params(model, kwargs) {
  /*"""
  Update model with parameters or intitials
  by kwargs key and value.

  """*/
  var model_parameters = [
    "beta_1", "beta_2",
    "gamma_1", "gamma_2",
    "omega_1", "omega_2",
    "sigma_1", "sigma_2",
    "nu_1", "nu_2",
    "d0_1", "d0_2",
    "kappa_1", "kappa_2",
    "theta_1", "theta_2",
    "k_min", "H_thres", "epsilon",
    "k_t", "Phi_1_t", "Phi_2_t"];


  for (var key in kwargs) {
    if (model_parameters.includes(key)) {
      model[key] = kwargs[key]
    }
  }
  return model
}

function save_data(model, dat) {
  /* Save data from model run to readable series format
  for highcharts
    */
  var time = dat.time();
  var I_1 = [];
  var I_2 = [];

//  var Repro_number_1 = [];
//  var Repro_number_2 = [];

  var SS = [];
  var SI = [];
  var SR = [];
  var IS = [];
  var II = [];
  var IR = [];
  var RS = [];
  var RI = [];
  var RR = [];

  for (let i = 0; i < time.length; i++) {
    if (i%10 == 0) {    // subsampling to prevent lagging from plotting
      //New cases
      I_1.push([time[i]/360, (dat.IS()[i] + dat.II()[i] + dat.IR()[i])*1000 ]);
      I_2.push([time[i]/360, (dat.SI()[i] + dat.II()[i] + dat.RI()[i])*1000 ]);

      //reproduction numbers
//      if (i >= 4) {
//        Repro_number_1.push([time[i]/360, I_1[i] / I_1[i - 4]]);
//        Repro_number_2.push([time[i]/360, I_2[i] / I_2[i - 4]]);
//      }

      //compartments
      SS.push([time[i]/360, dat.SS()[i]]);
      SI.push([time[i]/360, dat.SI()[i]]);
      SR.push([time[i]/360, dat.SR()[i]]);
      IS.push([time[i]/360, dat.IS()[i]]);
      II.push([time[i]/360, dat.II()[i]]);
      IR.push([time[i]/360, dat.IR()[i]]);
      RS.push([time[i]/360, dat.RS()[i]]);
      RI.push([time[i]/360, dat.RI()[i]]);
      RR.push([time[i]/360, dat.RR()[i]]);
    }
  }

  data = {
    "NewCases":
      [
        {
          name: "Disease 1",
          data: I_1,
          dashStyle: 'Line',
        },
        {
          name: "Disease 2",
          data: I_2,
          dashStyle: 'Line',
        },
      ],
//    "Rs":
//      [{
//        name: "Disease 1",
//        dashStyle: 'DashDot',
//        data: Repro_number_1,
//      },
//      {
//        name: "Disease 2",
//        dashStyle: 'Line',
//        data: Repro_number_2,
//      },
//      ],
    "Compartments":
      [{
        name: "Susceptible - Susceptible",
        data: SS,
      }, {
        name: "Susceptible - Infectious",
        data: SI,
      }, {
        name: "Susceptible - Recovered",
        data: SR,
      }, {
        name: "Infectious - Susceptible",
        data: IS,
      }, {
        name: "Infectious - Infectious",
        data: II,
      }, {
        name: "Infectious - Recovered",
        data: IR,
      }, {
        name: "Recovered - Susceptible",
        data: RS,
      }, {
        name: "Recovered - Infectious",
        data: RI,
      }, {
        name: "Recovered - Recovered",
        data: RR,
      }
      ]
  }
}

var main_parameters = {
  "beta_1": {
    "id": "beta_1",
    "name": "Transition rate disease 1",
    "math": "&beta;<sub>1</sub>",
    "min": 0.10,
    "max": 0.50,
    "value": 0.30,
    "description": "Transition rate of the first disease."
  },
  "beta_2": {
    "id": "beta_2",
    "name": "Transition rate disease 2",
    "math": "&beta;<sub>2</sub>",
    "min": 0.10,
    "max": 0.50,
    "value": 0.25,
    "description": "Transition rate of the second disease."
  },
  "gamma_1": {
    "id": "gamma_1",
    "name": "Recovery rate disease 1",
    "math": "&gamma;<sub>1</sub>",
    "min": 0.05,
    "max": 0.50,
    "value": 0.10,
    "description": "Recovery rate of the first disease."
  },
  "gamma_2": {
    "id": "gamma_2",
    "name": "Recovery rate disease 2",
    "math": "&gamma;<sub>2</sub>",
    "min": 0.05,
    "max": 0.50,
    "value": 0.10,
    "description": "Recovery rate of the second disease."
  },
  "omega_1": {
    "id": "omega_1",
    "name": "Waning rate disease 1",
    "math": "&omega;<sub>1</sub>",
    "min": 0.0,
    "max": 0.1,
    "value": 1./360.,
    "description": "Immunity waning rate of the first disease."
  },
  "omega_2": {
    "id": "omega_2",
    "name": "Waning rate disease 2",
    "math": "&omega;<sub>2</sub>",
    "min": 0.0,
    "max": 0.1,
    "value": 1./360.,
    "description": "Immunity waning rate of the second disease."
  },
  "sigma_1": {
    "id": "sigma_1",
    "name": "Cross-immunity disease 2 -> 1",
    "math": "&sigma;<sub>1</sub>",
    "min": 0.0,
    "max": 1.0,
    "value": 0.00,
    "description": "Fraction of how much immunity against second disease protects against first disease."
  },
  "sigma_2": {
    "id": "sigma_2",
    "name": "Cross-immunity disease 2 -> 1",
    "math": "&sigma;<sub>2</sub>",
    "min": 0.0,
    "max": 1.0,
    "value": 0.00,
    "description": "Fraction of how much immunity against first disease protects against second disease."
  },
  "kappa_1": {
    "id": "kappa_1",
    "name": "Strength of k(t) on disease 1",
    "math": "&kappa;<sub>1</sub>",
    "min": 0.0,
    "max": 1.0,
    "value": 1.0,
    "description": "How strongly the first disease is affected by external modulation of the contact rate, e.g. lockdowns."
  },
  "kappa_2": {
    "id": "kappa_2",
    "name": "Strength of k(t) on disease 2",
    "math": "&kappa;<sub>2</sub>",
    "min": 0.0,
    "max": 1.0,
    "value": 0.5,
    "description": "How strongly the second disease is affected by external modulation of the contact rate, e.g. lockdowns."
  },
}

var season_parameters = {
  "nu_1": {
    "id": "nu_1",
    "name": "Strength of seasonality disease 1",
    "math": "&mu;<sub>1</sub>",
    "min": 0.0,
    "max": 0.5,
    "value": 0.2,
    "description": "Strength of seasonality for first disease."
  },
  "nu_2": {
    "id": "nu_2",
    "name": "Strength of seasonality disease 2",
    "math": "&mu;<sub>2</sub>",
    "min": 0.0,
    "max": 0.5,
    "value": 0.2,
    "description": "Strength of seasonality for second disease."
  },
  "d0_1": {
    "id": "d0_1",
    "name": "Timing of seasonality disease 1",
    "math": "d<sup>0</sup><sub>1</sub>",
    "min": 0.0,
    "max": 360.,
    "value": 0.0,
    "description": "Timing of the maximum of seasonality for first disease."
  },
  "d0_2": {
    "id": "d0_2",
    "name": "Timing of seasonality disease 2",
    "math": "d<sup>0</sup><sub>2</sub>",
    "min": 0.0,
    "max": 360.,
    "value": 0.0,
    "description": "Timing of the maximum of seasonality for second disease."
  },
}

var feedback_parameters = {
  "theta_1": {
    "id": "theta_1",
    "name": "Perceived risk disease 1",
    "math": "&vartheta;<sub>1</sub>",
    "min": 0.0,
    "max": 2.0,
    "value": 1.0,
    "description": "Weigh of perceived risk caused by first disease."
  },
  "theta_2": {
    "id": "theta_2",
    "name": "Perceived risk disease 2",
    "math": "&vartheta;<sub>2</sub>",
    "min": 0.0,
    "max": 2.0,
    "value": 1.0,
    "description": "Weigh of perceived risk caused by second disease."
  },
  "k_min": {
    "id": "k_min",
    "name": "Minimal contact rate",
    "math": "k<sub>min</sub>",
    "min": 0.0,
    "max": 1.0,
    "value": 0.5,
    "description": "Minimal contact rate reached by voluntary contact reduction."
  },
//  "H_thres": {
//    "id": "H_thres",
//    "name": "Threshold of perceived risk",
//    "math": "H<sub>thres</sub>",
//    "min": 0.00,
//    "max": 0.01,
//    "value": 0.2,
//    "description": "Minimal contact rate reached by voluntary contact reduction."
//  },
//  "epsilon": {
//    "id": "epsilon",
//    "name": "shape parameter of the softplus function",
//    "math": "H<sub>thres</sub>",
//    "min": 0.00,
//    "max": 0.002,
//    "value": 0.2,
//    "description": "shape parameter of the softplus function"
//  },
}


var initials = {
  "SS": {
    "id": "SS",
    "name": "Susceptible - Susceptible",
    "math": "X<sub>SS</sub>",
    "min": 0.0,
    "max": 1.0,
    "value": 1.0,
    "description": "TODO"
  },
  "SI": {
    "id": "SI",
    "name": "Susceptible - Infectious",
    "math": "X<sub>SI</sub>",
    "min": 0.0,
    "max": 1.0,
    "value": 0.0,
    "description": "TODO"
  },
  "SR": {
    "id": "SR",
    "name": "Susceptible - Recovered",
    "math": "X<sub>SR</sub>",
    "min": 0.0,
    "max": 1.0,
    "value": 0.0,
    "description": "TODO"
  },
  "IS": {
    "id": "IS",
    "name": "Infectious - Susceptible",
    "math": "X<sub>IS</sub>",
    "min": 0.0,
    "max": 1.0,
    "value": 0.0,
    "description": "TODO"
  },
  "II": {
    "id": "II",
    "name": "Infectious - Infectious",
    "math": "X<sub>II</sub>",
    "min": 0.0,
    "max": 1.0,
    "value": 0.0,
    "description": "TODO"
  },
  "IR": {
    "id": "IR",
    "name": "Infectious - Recovered",
    "math": "X<sub>IR</sub>",
    "min": 0.0,
    "max": 1.0,
    "value": 0.0,
    "description": "TODO"
  },
  "RS": {
    "id": "RS",
    "name": "Recovered - Susceptible",
    "math": "X<sub>RS</sub>",
    "min": 0.0,
    "max": 1.0,
    "value": 0.0,
    "description": "TODO"
  },
  "RI": {
    "id": "RI",
    "name": "Recovered - Infectious",
    "math": "X<sub>RI</sub>",
    "min": 0.0,
    "max": 1.0,
    "value": 0.0,
    "description": "TODO"
  },
  "RR": {
    "id": "RR",
    "name": "Recovered - Recovered",
    "math": "X<sub>RR</sub>",
    "min": 0.0,
    "max": 1.0,
    "value": 0.0,
    "description": "TODO"
  },
}
// Special parameters contact k and influx phi
var spezial = {
  "k_t": {
    "id": "k_t",
    "name": "External change of contact rate",
    "math": "k<sub>t</sub>",
    "min": 0.0,
    "max": 2.0,
    "value": 1.0,
    "description": "Modulation parameter for external changes of the contact rate, e.g. lockdowns.",
    "change_points": 0,
    "peak": 0,
  },
  "Phi_1_t": {
    "id": "Phi_1_t",
    "name": "External influx disease 1",
    "math": "&phiv;<sub>1</sub>(t)",
    "min": 0.0,
    "max": 5.,
    "value": 1.,
    "description": "New infections added by external influx (per thousand).",
    "change_points": 0,
    "peak": 0,
  },
  "Phi_2_t": {
    "id": "Phi_2_t",
    "name": "External influx disease 2",
    "math": "&phiv;<sub>2</sub>(t)",
    "min": 0.0,
    "max": 5.,
    "value": 1.,
    "description": "New infections added by external influx (per thousand).",
    "change_points": 0,
    "peak": 0,
  }
}


// ---------------------------------------------------------------------------- //
// Parameter sliders
// ---------------------------------------------------------------------------- //
slider_init = false;
function _add_sliders_to_div(main_div, parameter) {
  /*
  Function to add a slider to a div
  */
  //We create two divs one for the header and one for the slider
  var header_div = document.createElement("div");
  var slider_div = document.createElement("div");

  //Add classes to slider and header
  header_div.classList.add("row", "form-header")
  slider_div.classList.add("form-linked-inputs", "d-flex", "align-items-center")


  //Construct inner header
  var inner_header_description = document.createElement("label");
  inner_header_description.classList.add("form-label", "col");
  inner_header_description.innerHTML = `${parameter["name"]}
  <i class="far fa-question-circle" title='${parameter["description"]}' data-toggle="tooltip" tabindex="0" data-html="true" ></i>
  `;

  var inner_header_math = document.createElement("label");
  inner_header_math.classList.add("form-label", "col");
  inner_header_math.innerHTML = `<math> ${parameter["math"]}</math>`;

  header_div.appendChild(inner_header_description)
  header_div.appendChild(inner_header_math)

  //Construct inner slider
  var inner_slider_range = document.createElement("input");
  inner_slider_range.classList.add("form-range")
  inner_slider_range.id = parameter["id"]
  inner_slider_range.type = "range"
  inner_slider_range.min = parameter["min"]
  inner_slider_range.max = parameter["max"]
  if ("step" in parameter) {
    inner_slider_range.step = parameter["step"]
  }
  else {
    inner_slider_range.step = 0.001
  }

  inner_slider_range.value = parameter["value"]


  var inner_slider_number = document.createElement("input");
  inner_slider_number.classList.add("form-number")
  inner_slider_number.id = parameter["id"]
  inner_slider_number.type = "number"
  inner_slider_number.min = parameter["min"]
  inner_slider_number.max = parameter["max"]
  if ("step" in parameter) {
    inner_slider_range.step = parameter["step"]
  }
  else {
    inner_slider_range.step = 0.001
  }
  inner_slider_number.value = parameter["value"]

  //Event to update global dicts
  inner_slider_range.addEventListener('input', function (e) {
    parameter["value"] = parseFloat(e.target.value);
    throttle(model_run());
  }.bind(parameter));
  inner_slider_number.addEventListener('input', function (e) {
    parameter["value"] = parseFloat(e.target.value);
    throttle(model_run());
  }.bind(parameter));

  slider_div.appendChild(inner_slider_range)
  slider_div.appendChild(inner_slider_number)


  // Add to main div
  main_div.appendChild(header_div)
  main_div.appendChild(slider_div)
}

function _setup_modulation_parameter(main_div, parameters) {
  /*
  Two cards one for the parameters and one for the plot
  of the parameter.

  -> Button to add changepoints and button to add influx
  */

  function create_initial_chart_drag_and_drop(div, parameter) {
    //If div has no id generate one
    if (div.id == "") {
      div.id = "chartcontainer" + String(Math.random() * 450001);
    }

    //Get data for parameter line
    data_ar = [];
    for (let t = 0; t < t_max; t++) {
      data_ar[t] = parameter["cpp"].eval(t)
    }

    //Create drag and drop chart
    var myChart = Highcharts.chart(div.id, {
      title: "",
      yAxis: {
        min: parameter["min"],
        max: parameter["max"],
        title: {
          text: parameter["math"],
          useHTML: true,
        },
      },
      xAxis: {
        title: {
          text: "Time in days",
          useHTML: true,
        },
      },
      tooltip: {
        headerFormat: 'Day {point.key}<br/>',
        pointFormat: '{series.name}: <b>{point.y:.2f}</b><br/>',
        shared: true,
        valueDecimals: 2,
      },

      series: [
        {
          //First series for showing the change
          stickyTracking: false,
          showInLegend: false,
          marker: {
            enabled: false
          },
          name: parameter["math"],
          data: data_ar,
          lineWidth: 3,
        }],

      credits: {
        enabled: false,
      },
    });

    charts[parameter["id"]] = myChart;
  }

  function set_classes(button, inner_html) {
    button.type = "button";
    button.classList.add("btn", "btn-secondary");
    button_influx.classList.add("btn", "btn-secondary");
    button.innerHTML = inner_html;
  }


  function on_click_cp(event, parameter) {
    //Get chart
    let chart = charts[parameter["id"]];
    console.log("hi")
    //Create an changepoint
    parameter["cpp"].add_change(12.5, 5.0, parameter["cpp"].initial);

    //Count number of cps
    parameter["change_points"]++;


    let series = chart.addSeries({
      stickyTracking: false,
      dragDrop: {
        draggableX: true,
        draggableY: true,
        dragMaxY: parameter["max"],
        dragMinY: parameter["min"]
      },
      data: [{
        name: "Bound 1",
        x: 10,
        y: parameter["cpp"].initial,
      },
      {
        name: "Bound 2",
        x: 15,
        y: parameter["cpp"].initial,
      }],
      name: "Change point " + String(parameter["change_points"]),
      lineWidth: 0,
      states: {
        hover: {
          lineWidthPlus: 0
        }
      },
      marker: {
        radius: 7.5,
        symbol: 'diamond',
        enabled: true,
      },
      cursor: 'move',
      point: {
        stickyTracking: false,
        events: {
          drag: function (e) {
            //update time_series_parameter
            min_y = this.series.dataMin;
            max_y = this.series.dataMax;

            if (this.series.data[0].x > this.series.data[1].x) {
              min_x = this.series.data[1].x
              max_x = this.series.data[0].x
            }
            else {
              min_x = this.series.data[0].x
              max_x = this.series.data[1].x
            }
            delta = Math.abs(this.series.data[0].x - this.series.data[1].x);

            let cp_index = 0;
            for (let i = 0; i < this.series.index; i++) {
              if (chart.series[i].name.includes("Change point")) {
                cp_index++;
              }
            }

            if (cp_index == 0) {
              //Update initial value
              parameter["cpp"].initial = this.series.data[0].y;
            }

            //Update
            parameter["cpp"].update_change(cp_index, min_x + delta / 2, delta, this.series.data[1].y);

            //Update main series
            let data_update = []
            for (let t = 0; t < t_max; t++) {
              data_update[t] = parameter["cpp"].eval(t);
            }
            chart.series[0].update({ data: data_update });
            throttle(model_run());
          }
        }
      }
    })
  }



  let count = 1;
  for (key in parameters) {
    let parameter = parameters[key];
    parameter["cpp"] = new Module.TimeDependentParameter(parameter["value"]);
    /* 
    Create visuals i.e. header, buttons, and chart
    -------------------------------------
    */

    //## Header
    var header_div = document.createElement("div");
    header_div.classList.add("row", "form-header")
    var inner_header_description = document.createElement("label");
    inner_header_description.classList.add("form-label", "col");
    inner_header_description.innerHTML = `${parameter["name"]}
    <i class="far fa-question-circle" title='${parameter["description"]}' data-toggle="tooltip" tabindex="0" data-html="true" ></i>
    `;
    var inner_header_math = document.createElement("label");
    inner_header_math.classList.add("form-label", "col");
    inner_header_math.innerHTML = `<math> ${parameter["math"]}</math>`;
    header_div.appendChild(inner_header_description);
    header_div.appendChild(inner_header_math);
    main_div.appendChild(header_div);

    //## Buttons
    var button_div = document.createElement("div");
    button_div.classList.add("modulation-param-buttons");
    var button_cp = document.createElement("button");
    var button_influx = document.createElement("button");

    set_classes(button_cp, "Add change point")
    set_classes(button_influx, "Add peak")
    button_cp.addEventListener("click", function (e) { on_click_cp(e, parameter) }.bind(parameter))
    button_influx.addEventListener("click", function (e) { on_click_inf(e, parameter) }.bind(parameter))

    //Append buttons to div
    button_div.appendChild(button_cp);
    button_div.appendChild(button_influx);
    //Append button div to main div
    main_div.appendChild(button_div);

    //Create drag and drop chart div
    var chart_div = document.createElement("div");
    chart_div.classList.add("modulation-param-chart");
    //Append to main div
    main_div.appendChild(chart_div);
    if (count != Object.keys(parameters).length) {
      main_div.appendChild(document.createElement("hr"));
    }
    //Create highchart
    create_initial_chart_drag_and_drop(chart_div, parameter);
    count++;
  }
}

function on_click_inf(event, parameter, mean=12.5, variance=0.0, change=0.5) {
  //Get chart
  let chart = charts[parameter["id"]];

  //Create an inputevent
  parameter["cpp"].add_inputevent(mean, variance, change);

  //Count number of peak
  parameter["peak"]++;

  let series = chart.addSeries({
    stickyTracking: false,
    dragDrop: {
      draggableX: true,
      draggableY: true,
      dragMaxY: parameter["max"],
      dragMinY: parameter["min"]
    },
    data: [{
      name: "Bound 1",
      x: mean,
      y: 1.0,
    },
    {
      name: "Bound 2",
      x: mean-variance,
      y: 1+change,
    }],
    name: "Peak " + String(parameter["peak"]),
    lineWidth: 0,
    states: {
      hover: {
        lineWidthPlus: 0
      }
    },
    marker: {
      radius: 7,
      symbol: 'square',
      enabled: true
    },
    point: {
      stickyTracking: false,
      events: {
        drag: function (e) {
          //update time_series_parameter
          min_y = this.series.dataMin;
          max_y = this.series.dataMax;
          mean = this.series.data[0].x
          change = this.series.data[1].y - 1
          variance = Math.abs(this.series.data[0].x - this.series.data[1].x)
          let inf_index = 0;
          for (let i = 0; i < this.series.index; i++) {
            if (chart.series[i].name.includes("Inputevent")) {
              inf_index++;
            }
          }

          parameter["cpp"].update_inputevent(inf_index, mean, variance, change);

          //Update main series
          let data_update = []
          for (let t = 0; t < t_max; t++) {
            data_update[t] = parameter["cpp"].eval(t);
          }
          chart.series[0].update({ data: data_update });
          throttle(model_run());
        }
      }
    }
  })
  
  //Update main series during init
  let data_update = []
  for (let t = 0; t < t_max; t++) {
    data_update[t] = parameter["cpp"].eval(t);
  }
  chart.series[0].update({ data: data_update });
  throttle(model_run());
}





function old() {
  var parameter_div = document.createElement("div");

  //Add initial button(s) to parameter div
  for (key in parameters) {
    if (key != "change_points" && key != "influx") {
      _add_sliders_to_div(parameter_div, parameters[key])
    }
  }

  //Add events to create cps and influx to the buttons
  button_cp.addEventListener("click", function () {
    // We add the sliders for 
    // center, value after and length
    var l = Object.keys(parameters["change_points"]).length / 3;

    //Construct parameters for the change_point
    var center = {
      "id": var_math + "_c_" + l,
      "name": "Center of change point " + l,
      "math": "",
      "min": 0.0,
      "max": 500.0,
      "value": 0,
      "description": "TODO"
    };
    var length = {
      "id": var_math + "_l_" + l,
      "name": "Length of change point " + l,
      "math": "",
      "min": 0.0,
      "max": 50.0,
      "value": 1.5,
      "description": "TODO"
    };
    var change = {
      "id": var_math + "_delta_" + l,
      "name": "Value after change point " + l,
      "math": "",
      "min": 0.0,
      "max": 1.0,
      "value": 0.6,
      "description": "TODO"
    };
    parameters["change_points"][center["id"]] = center;
    parameters["change_points"][length["id"]] = length;
    parameters["change_points"][change["id"]] = change;
    //Add them to
    parameter_div.appendChild(document.createElement("hr"))
    _add_sliders_to_div(parameter_div, center);
    _add_sliders_to_div(parameter_div, length);
    _add_sliders_to_div(parameter_div, change);

    setup_tooltips();
    create_interactive_forms();
  }.bind(parameters, parameter_div, var_math)
  );
  button_influx.addEventListener("click", function () {
    // We add the sliders for 
    // center, value after and length
    var l = Object.keys(parameters["influx"]).length / 3;

    //Construct parameters for the change_point
    var mean = {
      "id": var_math + "_m_" + l,
      "name": "Mean/location of influx event " + l,
      "math": "",
      "min": 0.0,
      "max": 500.0,
      "value": 0,
      "description": "TODO"
    };
    var variance = {
      "id": var_math + "_v_" + l,
      "name": "Variance of influx event " + l,
      "math": "",
      "min": 0.0,
      "max": 2.0,
      "value": 0.5,
      "description": "TODO"
    };
    var change = {
      "id": var_math + "_c_" + l,
      "name": "Change/scale of influx event " + l,
      "math": "",
      "min": 0.0,
      "max": 10.0,
      "value": 4,
      "description": "TODO"
    };
    parameters["influx"][mean["id"]] = mean;
    parameters["influx"][variance["id"]] = variance;
    parameters["influx"][change["id"]] = change;
    //Add them to
    var hr = document.createElement("hr")
    parameter_div.appendChild(hr)
    _add_sliders_to_div(parameter_div, mean);
    _add_sliders_to_div(parameter_div, variance);
    _add_sliders_to_div(parameter_div, change);

    setup_tooltips();
    create_interactive_forms();
  }.bind(parameters, parameter_div, var_math));


  //Append buttons to div
  button_div.appendChild(button_cp);
  button_div.appendChild(button_influx);

  //Append button div to main div
  main_div.appendChild(button_div);

  //Append horizontal line and add a div for the sliders
  var hr = document.createElement("hr");
  main_div.appendChild(hr);

  //Append parameter dic to main div
  main_div.appendChild(parameter_div);
}

window.addEventListener("load", setup_parameter_sliders);
function setup_parameter_sliders() {
  if (!wasm_init || !highchart_init) {
    setTimeout(setup_parameter_sliders, 10);
    return;
  }

  // Main model parameters
  // Hard defined parameters
  var main_div = document.getElementById("main_parameters");
  let count = 1;
  for (key in main_parameters) {
    _add_sliders_to_div(main_div, main_parameters[key])
    if (count != Object.keys(main_parameters).length) {
      main_div.appendChild(document.createElement("hr"))
    }
    count++;
  }
  set_sliders_to_dict(main_div, "main_parameters");

  //Seasonality parameters
  var main_div = document.getElementById("season_parameters");
  count = 1;
  for (key in season_parameters) {
    _add_sliders_to_div(main_div, season_parameters[key])
    if (count != Object.keys(season_parameters).length) {
      main_div.appendChild(document.createElement("hr"))
    }
    count++;
  }
  set_sliders_to_dict(main_div, "season_parameters");

  //Feedback parameters
  var main_div = document.getElementById("feedback_parameters");
  count = 1;
  for (key in feedback_parameters) {
    _add_sliders_to_div(main_div, feedback_parameters[key])
    if (count != Object.keys(feedback_parameters).length) {
      main_div.appendChild(document.createElement("hr"))
    }
    count++;
  }
  set_sliders_to_dict(main_div, "feedback_parameters");

  //Lockdown modulation
  var main_div = document.getElementById("contact");
  _setup_modulation_parameter(main_div, spezial)
  set_sliders_to_dict(main_div, "contact");
  create_interactive_forms();
  slider_init = true;
}

function set_sliders_to_dict(main_div, parameter_name) {
  /*
  Updates the slider values in the main div.
  */
  var inputs = main_div.querySelectorAll("input");
  for (input of inputs) {
    //Get paramer by id
    if (input.parameter_type == "change_points") {
      input.value = window[parameter_name]["change_points"][input.id]["value"]
    }
    else if (input.parameter_type == "influx") {
      input.value = window[parameter_name]["influx"][input.id]["value"]
    }
    else {
      input.value = window[parameter_name][input.id]["value"]
    }
  }
}



// ---------------------------------------------------------------------------- //
// Highcharts
// ---------------------------------------------------------------------------- //
window.charts = {}
highchart_init = false;
function _add_highchart_to_div(main_div, chart_params) {
  //Create chart div
  var chartDiv = document.createElement('div');
  chartDiv.className = 'chart';
  // Append chart div to main chart
  main_div.appendChild(chartDiv);



  //Create default chart
  var myChart = Highcharts.chart(chartDiv, {
    title: {
      text: chart_params["title"],
    },
    chart: {
      spacingTop: 20,
      spacingBottom: 20,
    },
    credits: {
      enabled: true
    },
    plotOptions: {
      series: {
        marker: {
          symbol: "circle",
          enabled: false //Disable markers
        },
        lineWidth: 4,
      }
    },
    tooltip: {
      headerFormat: 'Year {point.key}<br/>',
      pointFormat: '{series.name}: <b>{point.y:.2f}</b><br/>',
      shared: true,
      valueDecimals: 2,
    },
    legend: {
      symbolWidth: 40
    },
    series: chart_params["data_placeholder"], //For some strange reason one needs placeholders here
    xAxis: {
      title: {
        text: 'Time in years',
      },
      min: 1,   // min of x-axis
    },
    yAxis: {
      title: {
        text: chart_params["label_yAxis"],
      },
      min: chart_params["ymin"],
      ceiling: chart_params["ymax"],
    },
    credits: {
      enabled: false,
    },
  });
  window["charts"][chart_params["id"]] = myChart;
}

window.addEventListener("load", setup_highcharts);
function setup_highcharts() {

  Highcharts.setOptions({
    chart: {
      style: {
        fontFamily: 'sans-serif',
        color: "#212529"
      }
    },
    title: {
      style: {
        color: '#212529',
        font: 'bold 16px "sans-serif"'
      }
    },
    xAxis: {
      lineWidth: 2,
      lineColor: "#212529",
      labels: {
        style: {
          color: '#212529',
          font: 'sans-serif'
        }
      },
      title: {
        style: {
          color: '#212529',
          fontSize: '12px',
          fontFamily: 'sans-serif'

        }
      }
    },
    yAxis: {
      lineWidth: 2,
      lineColor: "#212529",
      labels: {
        style: {
          color: '#212529',
          font: 'sans-serif'
        }
      },
      title: {
        style: {
          color: '#212529',
          fontSize: '12px',
          fontFamily: 'sans-serif'
        }
      }
    },
  });




  let charts_params = {
    "NewCases": {
      "id": "NewCases",
      "title": "Infectious individuals",
      "ymin": 0,
      "ymax": 1000,
      "label_yAxis": "Active cases per thousand",
      "data_placeholder": [
        { visible: true },
        { visible: true },
      ],
    },
//    "Rs": {
//      "id": "Rs",
//      "title": "Reproduction number",
//      "ymin": 0,
//      "ymax": 1000,
//      "label_yAxis": "Reproduction number",
//      "data_placeholder": [
//        { visible: true },
//        { visible: true },
//      ],
//    },
    "Compartments": {
      "id": "Compartments",
      "title": "Model compartments",
      "ymin": 0,
      "ymax": 1,
      "label_yAxis": "Fraction of population",
      "data_placeholder": [
        { visible: true },
        { visible: true },
        { visible: true },
        { visible: true },
        { visible: true },
        { visible: true },
        { visible: true },
        { visible: true },
        { visible: true },
      ],
    }
  }


  var main_div = document.getElementById("hs-container");
  for (key in charts_params) {
    _add_highchart_to_div(main_div, charts_params[key]);
  }

  highchart_init = true;
}

function update_highcharts_series() {
  for (key of ["NewCases", "Compartments"]) {
    charts[key].update({
      series: data[key],
    });
    charts[key].redraw();
  }

}

