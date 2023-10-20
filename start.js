// Initialize vis.js network
let container = document.getElementById("graph-container");
let initial_prob_table = document.getElementById("initial_prob_table");

const data = {
  nodes: new vis.DataSet([]),
  edges: new vis.DataSet([]),
};

function createEmptyTable(m, n) {
  const emptyTable = [];

  for (let i = 0; i < m; i++) {
    const row = new Array(n).fill("");
    emptyTable.push(row);
  }

  return emptyTable;
}

const fix_nums = 6;
const distances = []; // Array to store distance values
let editText = true;
let firstSteps = [NaN];
let totalFirstSteps = [NaN];
let visits = [0];
let totalVisits = [0];
let starting_state_probs = [];
let expected = [NaN];
let steady = expected[0];
let mean_first_passage = expected[1];
let full_mean_passage = expected[2];
let table_path = [createEmptyTable(data.nodes.length, 7)];
let state_names = [];

var state_name = "States";
var collaspeCnt = [false, false];

let currentState = NaN;
let isSimulationRunning = false;
let steps_per_sec = 100;
let expected_filled = false;
let currStep = 0;
let currIter = 0;
let totalSteps = 1000;
let totalIter = 1;
let iter_path = [[]];
let heatMapMode = false;
let edge_visits = {};
let max_visits = 0;
let edge_ids = {};
let hovering = false;
let selected = false;
let expected_methods = ["", ""];
let mixing_time = 10000;

const import_button = document.getElementById("import-data");
const add_button = document.getElementById("add-node-button");
const delete_button = document.getElementById("delete-node-button");

const stepSecInput = document.getElementById("stepsec-input");
const totalStepInput = document.getElementById("steps-input");
const totalIterInput = document.getElementById("iterate-input");

const heatmap_button = document.getElementById("heatmap-button");
const graph_button = document.getElementById("graph-button");

// Options for vis.js network visualization
const options = {
  interaction: {
    hover: true,
    tooltipDelay: 300,
  },
  nodes: {
    font: { size: 14, color: "black" },
    color: { highlight: "orange", hover: "orange", border: "black" },
  },
  edges: {
    color: { color: "#2B7CE9", hover: "#848484", highlight: "#848484" },
  },

  physics: {
    barnesHut: {
      gravitationalConstant: -2000,
      centralGravity: 0.3,
    },
  },
  edges: {
    arrows: {
      to: true,
    },
    smooth: {
      type: "dynamic", // You can set "dynamic" for smoother animations
      roundness: 0.5, // Controls the smoothness of edges (0 to 1)
    },
  },
};

const network = new vis.Network(container, data, options);

network.on("stabilizationIterationsDone", function () {
  // Disable physics after stabilization
  network.setOptions({ physics: false });
});

const distanceMatrixTable = document.getElementById("distance-matrix-table");

const statsTable = document.getElementById("stats-table");

const clearDistanceButton = document.getElementById("clear-button");

const center_button = document.getElementById("center-button");

const distShowButton = document.getElementById("dist-show-button");
const statShowButton = document.getElementById("stat-show-button");

const run_button = document.getElementById("run-button");

const stop_button = document.getElementById("stop-button");

const step_button = document.getElementById("step-button");
const reset_button = document.getElementById("reset-button");

const export_button = document.getElementById("export_data");

const data_file = document.getElementById("data-file");

const dist_div = document.getElementById("dist-div");
const stat_div = document.getElementById("stat-div");

const iterate_text = document.getElementById("iterate-text");
const steps_text = document.getElementById("steps-text");
