// Add an event listener to the Import Data button
import_button.addEventListener("click", function () {
  if (!editText) {
    return;
  }
  data_file.click();
});

// Add an event listener to the File Input element
data_file.addEventListener("change", function (event) {
  const file = event.target.files[0];
  // Clear the input value
  data_file.value = "";

  if (file) {
    resetStats();
    parseDataFile(file);
  }
});

// Function to parse the CSV or TSV file and populate the table
function parseDataFile(file) {
  const reader = new FileReader();

  reader.onload = function (event) {
    const fileExtension = file.name.split(".").pop().toLowerCase();
    const datas = event.target.result;
    data.nodes.clear();
    distances.length = 0;

    const tableBody = document.querySelector("#distance-matrix-table tbody");

    // Clear existing table content
    tableBody.innerHTML = "";

    const lines = datas.split("\n");
    const headers = lines[0].split(fileExtension === "tsv" ? "\t" : ",");

    // Create the header row
    let tableHTML = "<tr style='position: sticky; top: 0;'>";
    for (let i = 0; i < headers.length; i++) {
      tableHTML += `<th><div class="node-label" data-node-id="${i}">${headers[
        i
      ].trim()}</div></th>`;
    }
    tableHTML += "</tr>";

    state_name = headers[0];

    for (let i = 1; i < lines.length; i++) {
      distances.push(new Array(headers.length - 1).fill(""));
      const rowData = lines[i].split(fileExtension === "tsv" ? "\t" : ",");
      if (rowData.length === headers.length) {
        const row = tableBody.insertRow(-1);
        const fromNode = rowData[0].trim();
        data.nodes.add({ id: i, label: fromNode });
        row.insertCell(
          0
        ).innerHTML = `<div class="node-label" data-node-id="${i}">${fromNode}</div>`;
        for (let j = 1; j < headers.length; j++) {
          const weight = parseFloat(rowData[j].trim()).toFixed(fix_nums); // Round to 3 significant figures
          row.insertCell(
            j
          ).innerHTML = `<input type="text" value="${weight}" data-row="${i}" data-col="${j}" class="shorter-input">`;
          if (!isNaN(weight) && weight > 0) {
            distances[i - 1][j - 1] = weight;
            data.edges.add({
              id: data.edges.length,
              from: i,
              to: j,
              label: "",
            });
          }
        }
      }
    }

    for (let i = 0; i < starting_state_probs.length; i++) {
      initial_prob_table.deleteRow(initial_prob_table.rows.length - 2);
    }

    starting_state_probs = Array(data.nodes.length).fill(0);
    starting_state_probs[0] = 1;

    // Add the header row to the table
    tableBody.innerHTML = tableHTML + tableBody.innerHTML;
    updateDistanceMatrix();

    for (let i = 0; i < data.nodes.length; i++) {
      const newRow = initial_prob_table.insertRow(
        initial_prob_table.rows.length - 1
      );

      // get row i + 1 of distance ma

      const cell1 = newRow.insertCell(0);
      cell1.innerHTML = distanceMatrixTable.rows[i + 1].cells[0].textContent;

      const cell2 = newRow.insertCell(1);
      cell2.innerHTML = '<input type="number" min="0" max="1" >';

      if (starting_state_probs[i] > 0) {
        cell2.innerHTML =
          '<input type="number" min="0" max="1" value="' +
          starting_state_probs[i] +
          '">';
      } else {
        cell2.innerHTML = '<input type="number" min="0" max="1" >';
      }
    }

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
  };

  reader.readAsText(file);
}

// Event listener for the "Add Node" button
add_button.addEventListener("click", addNode);

// Event listener for the "Delete Node" button
delete_button.addEventListener("click", deleteNode);

clearDistanceButton.addEventListener("click", clearDistanceTable);

center_button.addEventListener("click", centerGraph);

distShowButton.addEventListener("click", () => {
  distShowButton.style.display = "none";

  distanceMatrixTable.style.display = "";

  var percent =
    (parseFloat(container.offsetHeight) /
      parseFloat(
        document.getElementsByClassName("container")[0].offsetHeight
      )) *
    100;
  var new_height = percent - (percent - 25) / 2;

  if (collaspeCnt[0] && collaspeCnt[1]) {
    container.style.height = new_height + "%";
  } else {
    container.style.height = "25%";
  }

  collaspeCnt[0] = false;
  centerGraph();
});

statShowButton.addEventListener("click", () => {
  statShowButton.style.display = "none";

  statsTable.style.display = "";

  var percent =
    (parseFloat(container.offsetHeight) /
      parseFloat(
        document.getElementsByClassName("container")[0].offsetHeight
      )) *
    100;
  var new_height = percent - (percent - 25) / 2;

  if (collaspeCnt[0] && collaspeCnt[1]) {
    container.style.height = new_height + "%";
  } else {
    container.style.height = "25%";
  }

  collaspeCnt[1] = false;
  centerGraph();
});

// Event listener for the run button
run_button.addEventListener("click", () => {
  if (!isSimulationRunning) {
    isSimulationRunning = true;
    simulateMarkovChain();
  }
});

// Event listener for the stop button
stop_button.addEventListener("click", () => {
  isSimulationRunning = false;
});

// Event listener for the step button
step_button.addEventListener("click", () => {
  if (!isSimulationRunning) {
    step();
  }
});

// Event listener for the reset button
reset_button.addEventListener("click", () => {
  isSimulationRunning = false;
  editText = true;
  if (!heatMapMode) {
    data.nodes.update({ id: currentState, color: null });
  }

  resetStats();
  updateStats();
});

stepSecInput.addEventListener("blur", () => {
  const currVal = stepSecInput.value;

  if (isValidPositiveNumber(currVal)) {
    steps_per_sec = currVal;
  } else {
    stepSecInput.value = steps_per_sec;
  }
});

totalStepInput.addEventListener("blur", () => {
  const currVal = totalStepInput.value;

  if (isValidPositiveNumber(currVal)) {
    totalSteps = currVal;
  } else {
    totalStepInput.value = totalSteps;
  }
});

totalIterInput.addEventListener("blur", () => {
  const currVal = totalIterInput.value;

  if (isValidPositiveNumber(currVal)) {
    totalIter = currVal;
  } else {
    totalIterInput.value = totalIter;
  }
});

function stringify2DArray(arr) {
  if (arr.length == 0) {
    return "[]";
  }
  return arr.map((row) => `[${row.join(", ")}]`).join("\n");
}

export_button.addEventListener("click", () => {
  let txt = "States: \n[";
  txt += state_names;
  txt += "]\n\nDistance Table:\n";
  txt += stringify2DArray(distances);
  txt += "\n\nInitial State Probs: \n[";
  txt += starting_state_probs;
  txt += "]\n\nSteady State Vector (Mixing Time = " + mixing_time + "):\n";
  txt += expected_methods[0] + "\n[";
  txt += steady;
  txt += "]\n\nFull First Arrival Step Matrix:\n";
  txt += expected_methods[1];
  txt += "\n";
  txt += stringify2DArray(full_mean_passage);

  if (!editText) {
    for (let i = 0; i < Math.min(currIter + 1, totalIter); i++) {
      txt += "\n\nIteration " + (i + 1) + ":\n";
      txt += JSON.stringify([
        "Visits",
        "Visit %",
        "Average Visit %",
        "Expected Visit %",
        "First Arrival Steps",
        "Average First Arrival Steps",
        "Expected First Arrival Steps",
      ]);
      txt += "\n";
      txt += stringify2DArray(table_path[i]);
      txt += "\n\nPath " + (i + 1) + ":\n[";
      txt += iter_path[i];
      txt += "]\n\n";
    }

    if (currIter == totalIter) {
      txt += "Final Iteration:\n";
      txt += JSON.stringify([
        "Visits",
        "Visit %",
        "Average Visit %",
        "Expected Visit %",
        "First Arrival Steps",
        "Average First Arrival Steps",
        "Expected First Arrival Steps",
      ]);
      txt += "\n";
      txt += stringify2DArray(table_path[currIter]);
    }
  }

  //copy to clipboard then have a message on button for a second then done
  const tempInput = document.createElement("input");
  tempInput.value = txt;
  document.body.appendChild(tempInput);
  tempInput.select();

  try {
    // Copy the text inside the text field
    navigator.clipboard.writeText(txt);
    // Success! You can perform any actions you need here.
    export_button.innerText = "Copied to ClipBoard";
    setTimeout(function () {
      export_button.innerText = "Export Data";
    }, 1000); // Change back after 2 seconds
  } catch (err) {
    export_button.innerText = "Failed to Copy";
    setTimeout(function () {
      export_button.innerText = "Export Data";
    }, 1000); // Change back after 2 seconds
  } finally {
    document.body.removeChild(tempInput);
  }
});

heatmap_button.addEventListener("click", () => {
  heatMapMode = true;
  updateVisualization(currentState, currentState);
});

graph_button.addEventListener("click", () => {
  heatMapMode = false;
  updateVisualization(currentState, currentState);
});

// Add an initial node when the page loads
addNode();
