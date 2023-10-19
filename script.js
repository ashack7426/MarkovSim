// Function to update the distance matrix
function updateDistanceMatrix() {
  // ... (previous code)
  const numNodes = data.nodes.length;
  firstSteps = Array(numNodes).fill(NaN);
  totalFirstSteps = Array(numNodes).fill(NaN);
  visits = Array(numNodes).fill(0);
  totalVisits = Array(numNodes).fill(0);
  table_path = [createEmptyTable(data.nodes.length, 7)];
  state_names = [];

  // Create the header row
  let tableHTML =
    "<tr style = 'position: sticky; top: 0;'><th>" + state_name + "</th>";
  for (let i = 0; i < numNodes; i++) {
    const label = data.nodes.get(i + 1).label || `State ${i + 1}`;
    state_names.push(label);
    tableHTML += `<th><div class="node-label" data-node-id="${
      i + 1
    }">${label} </div></th>`;
  }
  tableHTML += "</tr>";

  // Populate the distance matrix
  for (let i = 0; i < numNodes; i++) {
    const label = data.nodes.get(i + 1).label || `State ${i + 1}`;
    tableHTML += `<tr><td><div class="node-label" data-node-id="${
      i + 1
    }">${label}</div></td>`;
    for (let j = 0; j < numNodes; j++) {
      distance = parseFloat(distances[i][j]) || "";
      if (distance !== "" && distance > 0) {
        distance = parseFloat(distance).toFixed(fix_nums); // Round to 3 significant figures
      } else {
        distance = "";
        distances[i][j] = "";
      }
      tableHTML += `<td><input type="text" id="distance-${i}-${j}" value="${distance}" data-row="${i}" data-col="${j}"class="shorter-input"></td>`;
    }
    tableHTML += "</tr>";
  }

  // Update the table content
  distanceMatrixTable.innerHTML = tableHTML;

  // Add event listeners to change node labels and set contentEditable to true
  const nodeLabels = document.querySelectorAll(".node-label");
  nodeLabels.forEach((label) => {
    label.setAttribute("contentEditable", "true"); // Set contentEditable to true
    label.addEventListener("blur", () => {
      const nodeId = label.getAttribute("data-node-id");
      const newName = label.textContent;
      if (newName) {
        data.nodes.update({ id: parseInt(nodeId), label: newName });
        initial_prob_table.rows[nodeId].cells[0].textContent = newName;
        updateDistanceMatrix();
      }
    });
  });

  // Add event listeners to update distances when input values change
  const inputFields = document.querySelectorAll("input[type='text']");
  inputFields.forEach((input) => {
    input.addEventListener("blur", () => {
      const row = input.getAttribute("data-row");
      const col = input.getAttribute("data-col");

      distances[row][col] = input.value;

      if (editText) {
        updateDistanceMatrix();
      }
    });

    input.addEventListener("keydown", (event) => {
      if (event.keyCode === 13) {
        // Enter key
        input.blur(); // Trigger blur event to update on Enter key press
      }
    });
  });

  // Get the cell in the first row and first column directly using table.rows and table.rows[0].cells
  const cell00 = distanceMatrixTable.rows[0].cells[0];

  // Add an event listener to the cell
  cell00.addEventListener("click", () => {
    // Get the computed style, which includes 'maxHeight'
    const computedStyle = window.getComputedStyle(dist_div);

    // Extract the 'maxHeight' property
    const maxHeight = computedStyle.getPropertyValue("max-height");

    // Extract the numeric value (without 'px' or other units)
    const maxHeightPerecnt = parseFloat(maxHeight);

    new_height = Math.min(
      dist_div.offsetHeight,
      (maxHeightPerecnt / 100) *
        document.getElementsByClassName("container")[0].offsetHeight
    );

    container.style.height = container.offsetHeight + new_height + "px";

    // Your event handling code here
    distShowButton.style.display = "block";

    // Show the other element
    distanceMatrixTable.style.display = "none"; // or "inline" or "inline-block" as needed

    collaspeCnt[0] = true;

    // Get references to all input elements with the "probability-input" class

    centerGraph();
  });

  const inputElements = initial_prob_table.querySelectorAll("input");

  // Add blur event listener to each input element
  inputElements.forEach((inputElement) => {
    inputElement.addEventListener("blur", function () {
      const inputValue = parseFloat(inputElement.value);
      // Find the parent row of the input element
      const row = inputElement.closest("tr");
      const rowIndex = Array.from(row.parentNode.children).indexOf(row);

      if (isNaN(inputValue) || inputValue < 0 || inputValue > 1) {
        // If the input is not a valid number between 0 and 1, revert to the previous value
        inputElement.value = starting_state_probs[rowIndex - 1];
      } else {
        starting_state_probs[rowIndex - 1] = parseFloat(inputElement.value);
      }

      if (inputElement.value == 0) {
        inputElement.value = "";
      }

      // Recalculate and update the "Total" row
      const totalRow = document.querySelector(
        "#initial_prob_table tr:last-child td:last-child"
      );
      const inputs = initial_prob_table.querySelectorAll("input");
      let total = 0;

      inputs.forEach((input) => {
        total += parseFloat(input.value) || 0;
      });

      totalRow.textContent = total.toFixed(fix_nums);
    });
  });

  // Recalculate and update the "Total" row
  const totalRowCell =
    initial_prob_table.rows[initial_prob_table.rows.length - 1];

  if (typeof totalRowCell !== "undefined") {
    totalRowCell.cells[0].addEventListener("click", function () {
      total = parseFloat(totalRowCell.cells[1].textContent);
      let size = data.nodes.length;

      if (total == 0) {
        initial_prob_table.querySelectorAll("input").forEach((input, index) => {
          const val = parseFloat((1 / size).toFixed(fix_nums));
          input.value = val;
          starting_state_probs[index] = val;
        });
      } else {
        initial_prob_table.querySelectorAll("input").forEach((input, index) => {
          const val = parseFloat(
            (starting_state_probs[index] / total).toFixed(fix_nums)
          );
          if (val == 0) {
            input.value = "";
          } else {
            input.value = val;
          }
          starting_state_probs[index] = val;
        });
      }
      totalRowCell.cells[1].textContent = 1;
    });
  }

  // Update the vis.js network with new distances
  addTotalColumn();
  updateVisNetwork();
}

// Function to update the vis.js network with new distances
function updateVisNetwork() {
  // Clear existing edges
  data.edges.clear();

  // Add new edges based on distances
  for (let i = 0; i < distances.length; i++) {
    for (let j = 0; j < distances[i].length; j++) {
      const distance = distances[i][j];
      if (distance !== "" && !isNaN(parseFloat(distance))) {
        data.edges.add({
          id: data.edges.length,
          from: i + 1,
          to: j + 1,
          label: "",
        });
      }
    }
  }

  // Set the graph container's height to match the table's height
  ///container.style.height = `${distanceMatrixTable.clientHeight}px`;
  populateStatsTable();
}

// Function to add a new node and update the distance matrix
function addNode() {
  if (!editText) {
    return;
  }
  const nodeId = data.nodes.length + 1;
  data.nodes.add({ id: nodeId, label: `State ${nodeId}` });

  // Add a new row and column to the distances array
  const numNodes = data.nodes.length;
  for (let i = 0; i < numNodes - 1; i++) {
    distances[i].push("");
  }

  distances.push(new Array(numNodes).fill(""));
  firstSteps.push(NaN);
  totalFirstSteps.push(NaN);
  visits.push(0);
  totalVisits.push(0);

  if (nodeId == 1) {
    starting_state_probs.push(1);
  } else {
    starting_state_probs.push(0);
  }

  if (nodeId > 1) {
    const newRow = initial_prob_table.insertRow(
      initial_prob_table.rows.length - 1
    );

    const cell1 = newRow.insertCell(0);
    cell1.innerHTML = "State " + nodeId;

    const cell2 = newRow.insertCell(1);
    cell2.innerHTML = '<input type="number" min="0" max="1" >';
  }

  // Update the distance matrix
  updateDistanceMatrix();
}

// Function to delete the last node and update the distance matrix
function deleteNode() {
  if (!editText) {
    return;
  }
  const numNodes = data.nodes.length;
  if (numNodes <= 1) {
    return; // Ensure at least one node remains
  }

  // Remove the last node from the dataset
  const nodeIdToDelete = numNodes;
  data.nodes.remove({ id: nodeIdToDelete });

  // Remove the last row and column from the distances array
  distances.pop();
  distances.forEach((row) => row.pop());
  firstSteps.pop();
  totalFirstSteps.pop();
  visits.pop();
  totalVisits.pop();
  starting_state_probs.pop();
  initial_prob_table.deleteRow(initial_prob_table.rows.length - 2);

  // Recalculate and update the "Total" row
  const totalRow = document.querySelector(
    "#initial_prob_table tr:last-child td:last-child"
  );
  const inputs = initial_prob_table.querySelectorAll("input");
  let total = 0;

  inputs.forEach((input) => {
    total += parseFloat(input.value) || 0;
  });

  totalRow.textContent = total.toFixed(fix_nums);

  // Update the distance matrix
  updateDistanceMatrix();
}

// Function to center the graph using network.fit()
function centerGraph() {
  // Assuming you have a reference to your vis.js network
  const network = new vis.Network(container, data, options);

  // Update the node data with the new size
  network.setData(data);

  // Center the graph
  network.fit();
}

// Function to populate the stats table with rows based on the number of states
function populateStatsTable() {
  const numStates =
    data.nodes
      .length; /* Get the number of states from your data or user input */

  // Clear existing rows (excluding header)
  while (statsTable.rows.length > 1) {
    statsTable.deleteRow(1);
  }

  // Get the table cell (row 1, column 1) by its id
  const cell = document.getElementById("stateName");

  // Change the text content
  cell.textContent = state_name;

  // get the
  //style = 'position: sticky; top: 0;
  first_row = statsTable.rows[0];
  first_row.style.position = "sticky";
  first_row.style.top = 0;

  // Create rows for each state
  for (let i = 0; i < numStates; i++) {
    const row = statsTable.insertRow(-1); // -1 appends the row at the end
    // Insert the first cell and set its content (state name)
    const cell0 = row.insertCell(0);
    cell0.textContent = data.nodes.get(i + 1).label; // State name or ID

    // Add a class to the first cell
    cell0.classList.add("node-label");
    cell0.setAttribute("contentEditable", "true");

    // Add an event listener to the first cell
    cell0.addEventListener("blur", function () {
      // Handle the click event for the first cell here
      // You can use `stateLabel` or other data as needed
      const nodeId = i + 1;
      const newName = cell0.textContent;
      if (newName) {
        data.nodes.update({ id: parseInt(nodeId), label: newName });
        updateDistanceMatrix();
      }
    });

    row.insertCell(1).textContent = "0"; // Default value for Visits
    row.insertCell(2).textContent = "-"; // Default value for Visits %
    row.insertCell(3).textContent = "-"; // Default value for Expected
    row.insertCell(4).textContent = "-";
    row.insertCell(5).textContent = "-";
    row.insertCell(6).textContent = "-";
    row.insertCell(7).textContent = "-";
  }

  cell.addEventListener("click", () => {
    // Get the computed style, which includes 'maxHeight'
    const computedStyle = window.getComputedStyle(stat_div);

    // Extract the 'maxHeight' property
    const maxHeight = computedStyle.getPropertyValue("max-height");

    // Extract the numeric value (without 'px' or other units)
    const maxHeightPerecnt = parseFloat(maxHeight);

    new_height = Math.min(
      stat_div.offsetHeight,
      (maxHeightPerecnt / 100) *
        document.getElementsByClassName("container")[0].offsetHeight
    );

    container.style.height = container.offsetHeight + new_height + "px";

    // Your event handling code here
    statShowButton.style.display = "block";

    // Show the other element
    statsTable.style.display = "none"; // or "inline" or "inline-block" as needed

    collaspeCnt[1] = true;

    //centerGraph();
  });
}

// Function to clear the distance table
function clearDistanceTable() {
  // Select all input elements in the table
  if (!editText) {
    return;
  }

  const inputElements =
    distanceMatrixTable.querySelectorAll("input[type='text']");

  // Clear the values of the input elements
  inputElements.forEach((input) => {
    const row = input.getAttribute("data-row");
    const col = input.getAttribute("data-col");
    distances[row][col] = "";
  });

  updateDistanceMatrix();
}

// Function to check if a string represents a positive number
function isValidPositiveNumber(str) {
  const number = parseFloat(str);
  return !isNaN(number) && number > 0;
}

// Function to choose a starting state based on probabilities
function chooseStartingState(probabilities) {
  const totalProbability = probabilities.reduce(
    (acc, probability) => acc + probability,
    0
  );
  const randomValue = Math.random() * totalProbability;

  let cumulativeProbability = 0;
  for (let i = 0; i < probabilities.length; i++) {
    cumulativeProbability += probabilities[i];
    if (randomValue <= cumulativeProbability) {
      return i; // Return the index of the chosen state
    }
  }

  // In case of rounding errors, return the last state
  return probabilities.length - 1;
}

// reset means the table is back to default and vars go back to 0
function resetStats() {
  expected_filled = false;
  currentState = NaN;
  isSimulationRunning = false;
  currStep = 0;
  currIter = 0;
  firstSteps = new Array(data.nodes.length).fill(NaN);
  totalFirstSteps = new Array(data.nodes.length).fill(NaN);
  visits = new Array(data.nodes.length).fill(0);
  totalVisits = new Array(data.nodes.length).fill(0);
  table_path = [createEmptyTable(data.nodes.length, 7)];
  iter_path = [[]];
}

// calc steady state and mean first passage time matrix
function calcExpectedVals() {
  // Convert the string matrix to a numeric matrix with 0 for empty strings
  const numericMatrix = distances.map((row) =>
    row.map((cell) => (cell === "" ? 0 : parseFloat(cell)))
  );

  const transition_matrix = math.matrix(numericMatrix);
  const dim = transition_matrix.size()[0];

  const numStates = transition_matrix.size()[0];
  let steadyStateProbabilities = new Array(numStates).fill(0);

  // Create an identity matrix
  const identity = math.zeros(dim, dim);
  for (let i = 0; i < dim; i++) {
    identity.subset(math.index(i, i), 1);
  }

  // Create a matrix Q by subtracting the identity matrix from p
  const q = math.subtract(transition_matrix, identity);

  // Append a column of ones to Q
  const ones = math.ones(dim, 1);
  const qWithOnes = math.concat(q, ones, 1);

  // Calculate Q^T * Q
  const QTQ = math.multiply(qWithOnes, math.transpose(qWithOnes));

  // Create a vector of ones
  const bQT = math.ones(dim);

  // Solve the linear system
  try {
    steadyStateProbabilities = math
      .lusolve(QTQ, bQT)
      ._data.map((subarray) => subarray[0]);
  } catch {
    console.log("Error with LU decomposition, using least-squares solution.");

    try {
      steadyStateProbabilities = math.multiply(
        math.inv(math.multiply(math.transpose(QTQ), QTQ)),
        math.multiply(math.transpose(QTQ), bQT)
      );

      console.log("Least-Squares Solution:");
    } catch {
      console.log("Error with least-squares solution");
    }
  }

  for (let i = 0; i < dim; i++) {
    if (steadyStateProbabilities[i] < 0) {
      steadyStateProbabilities[i] = 0;
    } else {
      steadyStateProbabilities[i] = math.max(
        0,
        parseFloat(steadyStateProbabilities[i].toFixed(fix_nums))
      );
    }
  }

  console.log("Steady-State Vector (Expected Visit Percentages):");
  console.log(steadyStateProbabilities);

  const meanFPTMatrix = math.zeros([numStates, numStates]);

  let indexes = {};
  let mean_indexes = {};
  cnt = 0;
  for (let i = 0; i < numStates; i++) {
    for (let j = 0; j < numStates; j++) {
      if (i != j) {
        const key = `(${i}, ${j})`;
        indexes[key] = cnt;
        mean_indexes[cnt] = [i, j];
        cnt += 1;
      }
    }
  }

  let A = math.zeros([cnt, cnt]);
  let B = math.matrix(Array(cnt).fill(-1));

  let row = 0;
  for (let i = 0; i < numStates; i++) {
    for (let j = 0; j < numStates; j++) {
      if (i === j) {
        // Diagonal elements
        if (steadyStateProbabilities[i] == 0) {
          meanFPTMatrix[i][j] = Infinity;
        } else if (isNaN(steadyStateProbabilities[i])) {
          meanFPTMatrix[i][j] = NaN;
        } else {
          meanFPTMatrix[i][j] = parseFloat(
            (1 / steadyStateProbabilities[i]).toFixed(fix_nums)
          );
        }
      } else {
        for (let k = 0; k < numStates; k++) {
          if (k !== j) {
            const key = `(${k}, ${j})`;
            let index = indexes[key];
            if (row == index) {
              A[row][index] = transition_matrix._data[i][k] - 1;
            } else {
              A[row][index] = transition_matrix._data[i][k];
            }
          }
        }
        row += 1;
      }
    }
  }

  // Solve the system using LU decomposition
  let X;
  try {
    X = math.lusolve(A, B).map((subarray) => subarray[0]);
    console.log("Exact solution found:");
  } catch (error) {
    try {
      // If LU decomposition fails, use an alternative method (least-squares)
      console.log("Error with LU decomposition, using least-squares solution.");

      X = math.multiply(
        math.inv(math.multiply(math.transpose(A), A)),
        math.multiply(math.transpose(A), B)
      )._data;

      console.log("Least-Squares Solution:");
    } catch (lsError) {
      // If the alternative method also fails, handle the error or provide an error message
      console.log("Error with least-squares solution, using psuedo inverse.");

      try {
        // Calculate the SVD
        const svd = numeric.svd(math.multiply(math.transpose(A), A));

        // Get the singular values, U, and V matrices
        const singularValues = svd.S;
        const U = svd.U;
        const V = svd.V;

        // Set a threshold for considering singular values as non-zero
        const epsilon = 1e-15;

        // Calculate the reciprocal of singular values, but set small values to 0
        const singularValuesReciprocal = singularValues.map((value) => {
          if (value > epsilon) {
            return 1 / value;
          } else {
            return 0;
          }
        });

        // Create the pseudo-inverse matrix
        const pseudoInverse = numeric.dot(
          U,
          numeric.dot(
            numeric.diag(singularValuesReciprocal),
            numeric.transpose(V)
          )
        );

        X = math.multiply(
          pseudoInverse,
          math.multiply(math.transpose(A), B)
        )._data;

        console.log("Pusedo Inverse Solution Found:");
      } catch (e) {
        console.log("Pusedo Inverse Failed: ");
        X = Array(numStates).fill(NaN);
      }
    }
  }

  for (let i = 0; i < cnt; i++) {
    let ii = mean_indexes[i][0];
    let jj = mean_indexes[i][1];
    if (X[i] < 0) {
      meanFPTMatrix[ii][jj] = NaN;
    } else {
      meanFPTMatrix[ii][jj] = math.max(0, parseFloat(X[i].toFixed(fix_nums)));
    }
  }

  console.log("Mean First-Passage Time:");
  console.log(meanFPTMatrix);

  console.log("Mean First-Passage Time (Given Starting Probs):");
  let starting_passage_time = new Array(numStates).fill(0);
  for (let i = 0; i < numStates; i++) {
    for (let j = 0; j < numStates; j++) {
      if (starting_state_probs[i] == 0) {
      } else if (!isNaN(meanFPTMatrix[i][j])) {
        starting_passage_time[j] +=
          starting_state_probs[i] * meanFPTMatrix[i][j];
      } else {
        starting_passage_time[j] = NaN;
      }
    }
  }

  for (let i = 0; i < numStates; i++) {
    if (starting_passage_time[i] == Infinity) {
      starting_passage_time[i] = NaN;
    }
  }
  console.log(starting_passage_time);
  return [steadyStateProbabilities, starting_passage_time, meanFPTMatrix];
}

// take 1 step
function step() {
  editText = false;
  if (!expected_filled) {
    currentState = chooseStartingState(starting_state_probs) + 1; //choose one with the probs
    updateVisualization(currentState, currentState);
  }

  if (currIter == totalIter) {
    updateStats();
    isSimulationRunning = false;
    return;
  }
  visits[currentState - 1] += 1;

  iter_path[currIter].push(state_names[currentState - 1]);

  // Calculate the next state based on transition probabilities
  const nextState = calculateNextState(currentState);

  if (isNaN(firstSteps[nextState - 1])) {
    firstSteps[nextState - 1] = currStep + 1;
  }

  // Update the visualization (e.g., change node colors)
  updateVisualization(currentState, nextState);

  // Update the current state
  currentState = nextState;
  currStep = (currStep + 1) % totalSteps;

  //iterate
  if (currStep == 0) {
    currStep = totalSteps;
    updateStats();
    currStep = 0;
    currentState = chooseStartingState(starting_state_probs) + 1;
    for (let i = 0; i < data.nodes.length; i++) {
      totalVisits[i] += visits[i];

      if (currIter == 0) {
        totalFirstSteps[i] = firstSteps[i];
      } else {
        totalFirstSteps[i] += firstSteps[i];
      }
    }
    currIter += 1;
    visits = Array(data.nodes.length).fill(0);
    firstSteps = Array(data.nodes.length).fill(NaN);

    iter_path.push([]);
    table_path.push(createEmptyTable(data.nodes.length, 7));
  } else {
    updateStats();
  }
}

// update the stats table
function updateStats() {
  if (!editText) {
    //make the text into inputs
    stepSecInput.setAttribute("readonly", true);
    totalStepInput.setAttribute("readonly", true);
    totalIterInput.setAttribute("readonly", true);

    initial_prob_table.querySelectorAll("input").forEach((input) => {
      input.setAttribute("readonly", true);
    });

    document.querySelectorAll(".node-label").forEach((label) => {
      label.removeAttribute("contentEditable");
    });

    let nodeCnt = data.nodes.length;

    //display expected calc once
    if (!expected_filled) {
      expected = calcExpectedVals();
      steady = expected[0];
      mean_first_passage = expected[1];
      full_mean_passage = expected[2];

      expected_filled = true;
      //put the expected vals on table
    }

    //input steps and iteration text
    iterate_text.textContent =
      "Iteration: " + Math.min(currIter + 1, totalIter) + "/";
    steps_text.textContent = "Steps: " + currStep + "/";
    if (currIter == totalIter) {
      steps_text.textContent = "Steps: " + totalSteps + "/";
    }

    iterate_text.appendChild(totalIterInput);
    steps_text.appendChild(totalStepInput);

    for (let i = 0; i < nodeCnt; i++) {
      statsTable.rows[i + 1].cells[4].textContent = 100 * steady[i];
      statsTable.rows[i + 1].cells[7].textContent = mean_first_passage[i];
      table_path[currIter][i][3] = 100 * steady[i];
      table_path[currIter][i][6] = mean_first_passage[i];
    }

    for (let i = 0; i < nodeCnt; i++) {
      statsTable.rows[i + 1].cells[1].textContent = visits[i];
      table_path[currIter][i][0] = visits[i];
      if (currStep == 0) {
        statsTable.rows[i + 1].cells[2].textContent = 0;
      } else {
        statsTable.rows[i + 1].cells[2].textContent = parseFloat(100 * (visits[i] / currStep)).toFixed(fix_nums);
      }

      table_path[currIter][i][1] = statsTable.rows[i + 1].cells[2].textContent;

      statsTable.rows[i + 1].cells[5].textContent = firstSteps[i];
      table_path[currIter][i][4] = firstSteps[i];

      if (currIter > 0) {
        statsTable.rows[i + 1].cells[3].textContent =
          parseFloat(100 * (totalVisits[i] / (currIter * totalSteps))).toFixed(fix_nums);

        statsTable.rows[i + 1].cells[6].textContent =
          parseFloat(totalFirstSteps[i] / currIter).toFixed(fix_nums);

        table_path[currIter][i][2] =
          parseFloat(100 * (totalVisits[i] / (currIter * totalSteps))).toFixed(fix_nums);
        table_path[currIter][i][5] = parseFloat(totalFirstSteps[i] / currIter).toFixed(fix_nums);
      }
    }

    document.querySelectorAll("input[type='text']").forEach((input) => {
      input.setAttribute("readonly", true);
    });
  } else {
    //reset everything
    stepSecInput.removeAttribute("readonly");
    totalStepInput.removeAttribute("readonly");
    totalIterInput.removeAttribute("readonly");

    initial_prob_table.querySelectorAll("input").forEach((input) => {
      input.removeAttribute("readonly");
    });

    document.querySelectorAll("input[type='text']").forEach((input) => {
      input.removeAttribute("readonly");
    });

    document.querySelectorAll(".node-label").forEach((label) => {
      label.setAttribute("contentEditable", "true");
    });

    //everything a dash or 0 and back to the start
    populateStatsTable();

    //input steps and iteration text are now 0
    iterate_text.textContent = "Iteration: 0/";
    steps_text.textContent = "Steps: 0/";

    iterate_text.appendChild(totalIterInput);
    steps_text.appendChild(totalStepInput);
  }
}

// simulate the markov chain
function simulateMarkovChain() {
  if (!isSimulationRunning) return;

  step();

  // Repeat the simulation step
  setTimeout(simulateMarkovChain, 1000 / steps_per_sec); // Perform one step per second
}

// Get the next state given current state and probs
function calculateNextState(currentState) {
  const probabilities = distances[currentState - 1];
  const randomValue = Math.random();
  let cumulativeProbability = 0;
  let val = 0;

  for (let nextState = 0; nextState < probabilities.length; nextState++) {
    val = parseFloat(probabilities[nextState]);
    if (isNaN(val)) {
      val = 0;
    }

    cumulativeProbability += val;
    if (randomValue < cumulativeProbability) {
      return nextState + 1;
    }
  }

  // Default to staying in the current state if no transition is chosen
  return currentState;
}

// make the current state default color and next state highlighted
function updateVisualization(currentState, nextState) {
  data.nodes.update({ id: currentState, color: null });
  data.nodes.update({ id: nextState, color: { background: "yellow" } });
}

// add the total column to the distance table
function addTotalColumn() {
  const rows = distanceMatrixTable.getElementsByTagName("tr");
  const tolerance = 0.0001;

  // Iterate through each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // If it's the first row, add a "Total Probs" header cell
    if (i === 0) {
      const headerCell = document.createElement("th");
      headerCell.textContent = "Total Probs";
      row.appendChild(headerCell);
    } else {
      // For data rows, calculate the total and add it to a new cell in the row
      const inputs = row.querySelectorAll("input[data-row]");
      const totalCell = document.createElement("td");
      let total = 0;

      inputs.forEach((input) => {
        const value = parseFloat(input.value) || 0;
        total += value;
      });

      val = parseFloat(total.toFixed(fix_nums));
      if (Math.abs(val - 1) <= tolerance) {
        val = 1;
      }
      totalCell.textContent = val;

      row.appendChild(totalCell);

      // Add a click event listener to the "Total Probs" cell for normalization
      totalCell.addEventListener("click", () => {
        // Get the row index for this "Total Probs" cell
        const rowIndex = totalCell.parentElement.rowIndex - 1; // Subtract 1 for the header row

        if (!editText) {
          return;
        }

        // Normalize probabilities to sum to 1
        if (total === 0) {
          inputs.forEach((input) => {
            let columnIndex = parseInt(input.getAttribute("data-col"), 10);
            input.value = parseFloat((1 / inputs.length).toFixed(fix_nums));
            distances[rowIndex][columnIndex] = input.value;
          });
        } else {
          inputs.forEach((input) => {
            let columnIndex = parseInt(input.getAttribute("data-col"), 10);
            let newValue = (parseFloat(input.value) || 0) / total;
            if (newValue == 0) {
              newValue = "";
            } else {
              newValue = parseFloat(newValue.toFixed(fix_nums));
            }
            input.value = newValue;
            distances[rowIndex][columnIndex] = newValue;
          });
        }

        totalCell.textContent = 1;
        updateVisNetwork();
      });

      const tbody = distanceMatrixTable.querySelector("tbody");
      const totalHeaderCell = tbody.querySelector("tr th:last-child");

      totalHeaderCell.addEventListener("click", () => {
        // Normalize all rows
        if (!editText) {
          return;
        }
        const rows = distanceMatrixTable.getElementsByTagName("tr");
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const inputs = row.querySelectorAll("input[data-row]");
          const totalCell = row.lastElementChild;

          let total = 0;

          inputs.forEach((input) => {
            const newValue = parseFloat(input.value) || 0;
            total += newValue;
          });

          total = parseFloat(total.toFixed(fix_nums));
          if (Math.abs(total - 1) <= tolerance) {
            total = 1;
          }

          if (total === 0) {
            inputs.forEach((input) => {
              let columnIndex = parseInt(input.getAttribute("data-col"), 10);
              input.value = parseFloat((1 / inputs.length).toFixed(fix_nums));
              distances[i - 1][columnIndex] = input.value;
            });
          } else if (total != 1) {
            inputs.forEach((input) => {
              const newValue = (parseFloat(input.value) || 0) / total;
              let columnIndex = parseInt(input.getAttribute("data-col"), 10);
              if (newValue == 0) {
                input.value = "";
              } else {
                input.value = parseFloat(newValue.toFixed(fix_nums));
              }
              distances[i - 1][columnIndex] = input.value;
            });
          }

          totalCell.textContent = 1;
        }
        updateVisNetwork();
      });
    }
  }
}
