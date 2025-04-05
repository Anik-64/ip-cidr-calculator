// Real-time validation functions
function validateCidrInput() {
  const input = document.getElementById("cidrInput");
  const error = document.getElementById("cidrInputError");
  if (!input.value.trim()) {
    input.classList.add("error-border");
    error.textContent = "Please enter a CIDR.";
    error.classList.remove("hidden");
  } else if (!isValidCidr(input.value.trim())) {
    input.classList.add("error-border");
    error.textContent = "Invalid CIDR format (192.168.1.0/24).";
    error.classList.remove("hidden");
  } else {
    input.classList.remove("error-border");
    error.classList.add("hidden");
  }
}

function validateIpToCidrInputs() {
  const firstIp = document.getElementById("firstIpInput");
  const lastIp = document.getElementById("lastIpInput");
  const error = document.getElementById("ipToCidrError");
  let message = "";

  if (!firstIp.value.trim() || !lastIp.value.trim()) {
    message = "Please enter both IPs.";
  } else if (!isValidIp(firstIp.value.trim())) {
    message = "Invalid First IP format (192.168.1.0).";
  } else if (!isValidIp(lastIp.value.trim())) {
    message = "Invalid Last IP format (192.168.1.255).";
  }

  if (message) {
    firstIp.classList.add("error-border");
    lastIp.classList.add("error-border");
    error.textContent = message;
    error.classList.remove("hidden");
  } else {
    firstIp.classList.remove("error-border");
    lastIp.classList.remove("error-border");
    error.classList.add("hidden");
  }
}

function validateAwsInputs() {
  const cidr = document.getElementById('awsCidrInput').value.trim();
  const mode = document.querySelector('input[name="subnetMode"]:checked').value;
  const numSubnets = document.getElementById('numSubnetsInput').value.trim();
  const hostInputs = Array.from(document.getElementsByClassName('subnet-hosts')).map(input => input.value.trim());

  if (!cidr) {
    showError('awsError', 'Please enter a CIDR range.');
    return false;
  }
  if (!isValidCidr(cidr)) {
    showError('awsError', 'Invalid CIDR format (e.g., 10.0.0.0/16).');
    return false;
  }

  if (mode === 'equal') {
    if (!numSubnets || isNaN(numSubnets) || numSubnets <= 0) {
      showError('awsError', 'Please enter a valid number of subnets (e.g., 4).');
      return false;
    }
    const [_, baseBits] = cidr.split('/');
    const totalHosts = Math.pow(2, 32 - parseInt(baseBits, 10));
    const hostsPerSubnet = totalHosts / parseInt(numSubnets, 10);
    if (hostsPerSubnet < 8) {
      showError('awsError', 'Each subnet must have at least 3 usable hosts (8 IPs total). Try fewer subnets.');
      return false;
    }
  } else {
    if (hostInputs.length === 0 || hostInputs.some(h => !h)) {
      showError('awsError', 'Please specify at least one subnet with a host count.');
      return false;
    }
    if (hostInputs.some(h => isNaN(h) || h <= 0)) {
      showError('awsError', 'All host counts must be positive numbers (e.g., 500).');
      return false;
    }
    if (hostInputs.some(h => parseInt(h) < 3)) {
      showError('awsError', 'Each subnet must have at least 3 usable hosts (8 IPs total).');
      return false;
    }
    const [_, baseBits] = cidr.split('/');
    const totalHosts = Math.pow(2, 32 - parseInt(baseBits, 10));
    const totalRequested = hostInputs.reduce((sum, h) => sum + Math.pow(2, Math.ceil(Math.log2(parseInt(h) + 5))), 0);
    if (totalRequested > totalHosts) {
      showError('awsError', 'Requested host counts exceed available IPs in the CIDR range.');
      return false;
    }
  }

  clearError('awsError');
  return true;
}

function validateOverlapInput() {
  const input = document.getElementById("overlapInput");
  const error = document.getElementById("overlapError");
  const cidrs = input.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (cidrs.length < 2) {
    input.classList.add("error-border");
    error.textContent = "Enter at least two CIDRs.";
    error.classList.remove("hidden");
  } else if (!cidrs.every(isValidCidr)) {
    input.classList.add("error-border");
    error.textContent =
      "All entries must be valid CIDRs (192.168.1.0/24).";
    error.classList.remove("hidden");
  } else {
    input.classList.remove("error-border");
    error.classList.add("hidden");
  }
}

function validateRouteInput() {
  const input = document.getElementById("routeInput");
  const error = document.getElementById("routeInputError");
  const cidrs = input.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (cidrs.length < 2) {
    input.classList.add("error-border");
    error.textContent = "Enter at least two CIDRs.";
    error.classList.remove("hidden");
  } else if (!cidrs.every(isValidCidr)) {
    input.classList.add("error-border");
    error.textContent =
      "All entries must be valid CIDRs (192.168.0.0/24).";
    error.classList.remove("hidden");
  } else {
    input.classList.remove("error-border");
    error.classList.add("hidden");
  }
}

// Clear section functions
function clearCidrSection() {
  document.getElementById("cidrInput").value = "";
  document.getElementById("cidrResult").classList.add("hidden");
  validateCidrInput();
}

function clearIpToCidrSection() {
  document.getElementById("firstIpInput").value = "";
  document.getElementById("lastIpInput").value = "";
  document.getElementById("ipToCidrResult").classList.add("hidden");
  validateIpToCidrInputs();
}

function clearAwsSection() {
  document.getElementById("awsCidrInput").value = "";
  document.getElementById("numSubnetsInput").value = "";
  document.getElementById("customSubnetInputs").innerHTML = `
    <div class="flex gap-2 items-center">
      <input type="number" class="subnet-hosts w-full p-2 border rounded" placeholder="Hosts for Subnet 1 (e.g., 500)" min="1" oninput="validateAwsInputs()">
      <input type="text" class="subnet-name w-1/2 p-2 border rounded" placeholder="Name (optional)">
      <button class="text-red-500 text-sm font-bold w-6 h-6 flex items-center justify-center border border-red-500 rounded hover:bg-red-100" onclick="this.parentElement.remove(); updatePlaceholders(); validateAwsInputs();">X</button>
    </div>
    <button id="addSubnet" class="text-blue-500 text-sm underline text-left">+ Add Another Subnet</button>
  `;
  document.getElementById("awsSubnetsResult").innerHTML = "";
  document.querySelector(
    'input[name="subnetMode"][value="equal"]'
  ).checked = true;
  toggleSubnetMode();
  validateAwsInputs();
  document.getElementById("addSubnet").addEventListener("click", () => {
    const subnetInputs = document.getElementById("customSubnetInputs");
    const subnetCount = subnetInputs.getElementsByClassName("subnet-hosts").length + 1;
    const inputContainer = document.createElement("div");
    inputContainer.className = "flex gap-2 items-center";
    const newInput = document.createElement("input");
    newInput.type = "number";
    newInput.className = "subnet-hosts w-full p-2 border rounded";
    newInput.placeholder = `Hosts for Subnet ${subnetCount}`;
    newInput.min = "1";
    newInput.oninput = validateAwsInputs;
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "subnet-name w-1/2 p-2 border rounded";
    nameInput.placeholder = `Name (optional)`;
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "X";
    deleteButton.className ="text-red-500 text-sm font-bold w-6 h-6 flex items-center justify-center border border-red-500 rounded hover:bg-red-100";
    deleteButton.onclick = () => {
      inputContainer.remove();
      updatePlaceholders();
      validateAwsInputs();
    };
    inputContainer.appendChild(newInput);
    inputContainer.appendChild(nameInput);
    inputContainer.appendChild(deleteButton);
    subnetInputs.insertBefore(inputContainer, document.getElementById("addSubnet"));
    updatePlaceholders();
  });
}

function clearOverlapSection() {
  document.getElementById("overlapInput").value = "";
  document.getElementById("overlapResult").innerHTML = "";
  validateOverlapInput();
}

function clearRouteSection() {
  document.getElementById("routeInput").value = "";
  document.getElementById("routeTable").classList.add("hidden");
  document.getElementById("routeError").textContent = "";
  validateRouteInput();
}

// Helper function to validate IP address
function isValidIp(ip) {
  const ipRegex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

// Helper function to validate CIDR
function isValidCidr(cidr) {
  const cidrRegex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/([0-2]?[0-9]|3[0-2])$/;
  return cidrRegex.test(cidr);
}

function ipToDecimal(ip) {
  return ip
    .split(".")
    .reduce((acc, octet, index) => acc + parseInt(octet) * Math.pow(256, 3 - index), 0);
}

function toggleSubnetMode() {
  const mode = document.querySelector('input[name="subnetMode"]:checked').value;
  document.getElementById('equalSubnetInput').classList.toggle('hidden', mode === 'custom');
  document.getElementById('customSubnetInputs').classList.toggle('hidden', mode === 'equal');
  validateAwsInputs();
}

// Helper function to show error message
function showError(elementId, message) {
  const errorSpan = document.getElementById(elementId);

  if (errorSpan) {
    errorSpan.textContent = message;
    errorSpan.classList.remove("hidden");
  }
}

// Helper function to clear error message
function clearError(elementId) {
  const errorSpan = document.getElementById(elementId);

  if (errorSpan) {
    errorSpan.textContent = "";
    errorSpan.classList.add("hidden");
  }
}

document.getElementById("cidrInput").addEventListener("input", () => {
  clearError("cidrInputError");
});

async function calculateCidrToIp() {
  const cidr = document.getElementById("cidrInput").value.trim();

  if (!cidr) {
    showError("cidrInputError", "Please enter a CIDR range.");
    document.getElementById("cidrResult").classList.add("hidden");
    return;
  }

  if (!isValidCidr(cidr)) {
    showError("cidrInputError", "Invalid CIDR format (192.168.1.0/24).");
    document.getElementById("cidrResult").classList.add("hidden");
    return;
  }

  clearError("cidrInputError");

  try {
    const response = await fetch("/api/v1/cidr-to-ip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cidr }),
    });

    const data = await response.json();

    if (data.error) {
      showError("cidrInputError", data.message);
      document.getElementById("cidrResult").classList.add("hidden");
      return;
    }

    const result = data.result;

    const table = document.getElementById("cidrResult");
    table.classList.remove("hidden");
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = `
      <tr>
        <td class="p-2">${result.cidrRange}</td>
        <td class="p-2">${result.netmask}</td>
        <td class="p-2">${result.wildcardBits}</td>
        <td class="p-2 border-b-2 border-blue-200">${result.firstIp}</td>
        <td class="p-2">${result.firstIpDecimal}</td>
        <td class="p-2 border-b-2 border-blue-200">${result.lastIp}</td>
        <td class="p-2">${result.lastIpDecimal}</td>
        <td class="p-2">${result.totalHosts}</td>
      </tr>
    `;
  } catch (error) {
    showError("cidrInput", "Failed to calculate. Please try again.");
    document.getElementById("cidrResult").classList.add("hidden");
  }
}

document.getElementById("firstIpInput").addEventListener("input", () => {
  clearError("ipToCidrError");
});

document.getElementById("lastIpInput").addEventListener("input", () => {
  clearError("ipToCidrError");
});

async function calculateIpToCidr() {
  const firstIp = document.getElementById("firstIpInput").value.trim();
  const lastIp = document.getElementById("lastIpInput").value.trim();

  if (!firstIp || !lastIp) {
    if (!firstIp) showError("ipToCidrError", "Please enter the both IPs.");
    if (!lastIp) showError("ipToCidrError", "Please enter the both IPs.");
    return;
  }

  if (!isValidIp(firstIp)) {
    showError("ipToCidrError", "Invalid IP format (192.168.1.0).");
    return;
  }

  if (!isValidIp(lastIp)) {
    showError("ipToCidrError", "Invalid IP format (192.168.1.255).");
    return;
  }

  const firstIpDecimal = ipToDecimal(firstIp);
  const lastIpDecimal = ipToDecimal(lastIp);

  if (firstIpDecimal > lastIpDecimal) {
    showError("ipToCidrError","First IP must be less than or equal to last IP.");
    return;
  }

  clearError("ipToCidrError");

  try {
    const response = await fetch("/api/v1/ip-to-cidr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstIp, lastIp }),
    });

    const data = await response.json();

    if (data.error) {
      showError("ipToCidrError", data.message);
      document.getElementById("ipToCidrResult").classList.add("hidden");
      return;
    }

    const result = data.result;

    const table = document.getElementById("ipToCidrResult");
    table.classList.remove("hidden");
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = `
      <tr>
        <td class="p-2">${result.ipRange}</td>
        <td class="p-2">${result.cidrNotation}</td>
        <td class="p-2">${result.netmask}</td>
        <td class="p-2">${result.totalHosts}</td>
      </tr>
    `;
  } catch (error) {
    showError("ipToCidrError", "Failed to calculate. Please try again.");
    document.getElementById("ipToCidrResult").classList.add("hidden");
  }
}

document.getElementById("addSubnet").addEventListener("click", () => {
  const subnetInputs = document.getElementById("customSubnetInputs");
  const subnetCount = subnetInputs.getElementsByClassName("subnet-hosts").length + 1;

  const inputContainer = document.createElement("div");
  inputContainer.className = "flex gap-2 items-center";

  const newInput = document.createElement("input");
  newInput.type = "number";
  newInput.className = "subnet-hosts w-1/2 p-2 border rounded";
  newInput.placeholder = `Hosts for Subnet ${subnetCount}`;
  newInput.min = "1";
  newInput.oninput = validateAwsInputs;

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "subnet-name w-1/2 p-2 border rounded";
  nameInput.placeholder = `Name (optional)`;

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "X";
  deleteButton.className =
    "text-red-500 text-sm font-bold w-6 h-6 flex items-center justify-center border border-red-500 rounded hover:bg-red-100";
  deleteButton.onclick = () => {
    inputContainer.remove();
    updatePlaceholders();
    validateAwsInputs();
  };

  inputContainer.appendChild(newInput);
  inputContainer.appendChild(nameInput);
  inputContainer.appendChild(deleteButton);

  subnetInputs.insertBefore(inputContainer, document.getElementById("addSubnet"));
  updatePlaceholders();
});

function updatePlaceholders() {
  const subnetInputs = document.getElementById("customSubnetInputs");
  const inputs = subnetInputs.getElementsByClassName("subnet-hosts");
  Array.from(inputs).forEach((input, index) => {
    input.placeholder = `Hosts for Subnet ${index + 1}`;
  });
}

async function calculateAwsSubnets() {
  if (!validateAwsInputs()) return;

  const cidr = document.getElementById("awsCidrInput").value.trim();
  const mode = document.querySelector('input[name="subnetMode"]:checked').value;
  const resultDiv = document.getElementById("awsSubnetsResult");
  resultDiv.innerHTML = "";

  let response;
  if (mode === "equal") {
    const numSubnets = document.getElementById("numSubnetsInput").value.trim();
    try {
      response = await fetch("/api/v1/aws-subnets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cidr, numSubnets }),
      });
    } catch (error) {
      showError("awsError", "Failed to generate subnets. Please try again.");
      return;
    }
  } else {
    const hosts = Array.from(
      document.getElementsByClassName("subnet-hosts")
    ).map((input) => parseInt(input.value));

    const names = Array.from(document.getElementsByClassName("subnet-name")).map(
      (input) => input.value.trim() || `Subnet ${Array.from(document.getElementsByClassName("subnet-name")).indexOf(input) + 1}`
    );
    
    try {
      response = await fetch("/api/v1/aws-subnets-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cidr, hosts, names }),
      });
    } catch (error) {
      showError("awsError", "Failed to generate subnets. Please try again.");
      return;
    }
  }

  const data = await response.json();
  if (data.error) {
    showError("awsError", data.message);
    return;
  }

  const subnets = data.subnets;
  subnets.forEach((subnet, index) => {
    resultDiv.innerHTML += `
      <div class="bg-gray-50 p-4 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-2">${subnet.name || `Subnet ${index + 1}`}</h3>
        <table class="w-full">
          <tr><td class="p-2 font-bold">CIDR Range</td><td class="p-2">${
            subnet.cidrRange
          }</td></tr>
          <tr><td class="p-2 font-bold">Netmask</td><td class="p-2">${
            subnet.netmask
          }</td></tr>
          <tr><td class="p-2 font-bold">Wildcard Bits</td><td class="p-2">${
            subnet.wildcardBits
          }</td></tr>
          <tr class="border-2 border-blue-200"><td class="p-2 font-bold">First IP</td><td class="p-2">${
            subnet.firstIp
          }</td></tr>
          <tr><td class="p-2 font-bold">First IP (Dec)</td><td class="p-2">${
            subnet.firstIpDecimal
          }</td></tr>
          <tr class="border-2 border-blue-200"><td class="p-2 font-bold">Last IP</td><td class="p-2">${
            subnet.lastIp
          }</td></tr>
          <tr><td class="p-2 font-bold">Last IP (Dec)</td><td class="p-2">${
            subnet.lastIpDecimal
          }</td></tr>
          <tr><td class="p-2 font-bold">Total Hosts</td><td class="p-2">${
            subnet.totalHosts
          }</td></tr>
          <tr><td class="p-2 font-bold text-green-600">Usable Hosts</td><td class="p-2">${
            subnet.usableHosts
          }</td></tr>
          <tr><td class="p-2 font-bold text-red-600">Reserved IPs</td><td class="p-2">${
            subnet.reservedIps
          }</td></tr>
        </table>
      </div>
    `;
  });
}

async function checkOverlap() {
  const input = document.getElementById("overlapInput").value.trim();
  const cidrs = input.split("\n").map((line) => line.trim()).filter(Boolean);

  if (cidrs.length < 2) {
    showError("overlapError", "Enter at least two CIDRs.");
    return;
  }

  if (!cidrs.every(isValidCidr)) {
    showError("overlapError", "All entries must be valid CIDRs.");
    return;
  }

  clearError("overlapError");

  try {
    const response = await fetch("/api/v1/check-overlap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cidrs }),
    });

    if (!response.ok) throw new Error("Server error");
    const data = await response.json();

    const resultDiv = document.getElementById("overlapResult");
    resultDiv.innerHTML = Array.isArray(data.overlaps)
      ? data.overlaps
          .map((overlap) => `<p class="text-red-500">${overlap}</p>`)
          .join("")
      : `<p class="text-green-500">${data.overlaps}</p>`;
  } catch (error) {
    showError("overlapError", "Failed to check overlaps. Please try again.");
  }
}

async function summarizeRoutes() {
  const input = document.getElementById("routeInput").value.trim();
  const cidrs = input.split("\n").map((line) => line.trim()).filter(Boolean);

  if (cidrs.length < 2) {
    showError("routeInputError", "Enter at least two CIDRs.");
    return;
  }

  if (!cidrs.every(isValidCidr)) {
    showError(
      "routeInputError",
      "All entries must be valid CIDRs (192.168.0.0/24)."
    );
    return;
  }

  clearError("routeInputError");

  try {
    const response = await fetch("/api/v1/summarize-routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cidrs }),
    });

    const data = await response.json();

    if (data.error) {
      showError("routeInputError", data.message);
      document.getElementById("routeResult").classList.add("hidden");
      return;
    }

    const table = document.getElementById("routeTable");
    document.getElementById("routeResult").classList.remove("hidden");
    table.classList.remove("hidden");
    document.getElementById("routeInputError").textContent = "";
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = `
      <tr>
        <td class="p-2">${data.originalCidrs.join(", ")}</td>
        <td class="p-2">${data.summarizedCidr}</td>
        <td class="p-2">${data.netmask}</td>
        <td class="p-2">${data.totalHosts}</td>
      </tr>
    `;
  } catch (error) {
    showError("routeInputError", "Failed to summarize. Please try again.");
    document.getElementById("routeResult").classList.add("hidden");
  }
}
