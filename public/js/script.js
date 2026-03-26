let currentSubnets = null;

// Real-time validation functions
function validateIpOnlyInput() {
  const input = document.getElementById("ipOnlyInput");
  const error = document.getElementById("cidrInputError");
  if (!input.value.trim()) {
    input.classList.add("error-border");
    error.textContent = "Please enter an IP Address.";
    error.classList.remove("hidden");
  } else if (!isValidIp(input.value.trim())) {
    input.classList.add("error-border");
    error.textContent = "Invalid IP format (e.g., 192.168.1.0).";
    error.classList.remove("hidden");
  } else {
    input.classList.remove("error-border");
    error.classList.add("hidden");
  }
}

function updateSubnetMaskDisplay() {
  const mask = document.getElementById("subnetMaskInput").value;
  document.getElementById("subnetMaskDisplay").innerText = "/" + mask;
  if(document.getElementById("ipOnlyInput").value.trim()) {
    validateIpOnlyInput();
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
  const cidr = document.getElementById("awsCidrInput").value.trim();
  const mode = document.querySelector('input[name="subnetMode"]:checked').value;
  const numSubnets = document.getElementById("numSubnetsInput").value.trim();
  const hostInputs = Array.from(
    document.getElementsByClassName("subnet-hosts")
  ).map((input) => input.value.trim());

  if (!cidr) {
    showError("awsError", "Please enter a CIDR range.");
    return false;
  }
  if (!isValidCidr(cidr)) {
    showError("awsError", "Invalid CIDR format (e.g., 10.0.0.0/16).");
    return false;
  }

  if (mode === "equal") {
    if (!numSubnets || isNaN(numSubnets) || numSubnets <= 0) {
      showError(
        "awsError",
        "Please enter a valid number of subnets (e.g., 4)."
      );
      return false;
    }
    const [_, baseBits] = cidr.split("/");
    const totalHosts = Math.pow(2, 32 - parseInt(baseBits, 10));
    const hostsPerSubnet = totalHosts / parseInt(numSubnets, 10);
    if (hostsPerSubnet < 8) {
      showError(
        "awsError",
        "Each subnet must have at least 3 usable hosts (8 IPs total). Try fewer subnets."
      );
      return false;
    }
  } else {
    if (hostInputs.length === 0 || hostInputs.some((h) => !h)) {
      showError(
        "awsError",
        "Please specify at least one subnet with a host count."
      );
      return false;
    }
    if (hostInputs.some((h) => isNaN(h) || h <= 0)) {
      showError(
        "awsError",
        "All host counts must be positive numbers (e.g., 500)."
      );
      return false;
    }
    if (hostInputs.some((h) => parseInt(h) < 3)) {
      showError(
        "awsError",
        "Each subnet must have at least 3 usable hosts (8 IPs total)."
      );
      return false;
    }
    const [_, baseBits] = cidr.split("/");
    const totalHosts = Math.pow(2, 32 - parseInt(baseBits, 10));
    const totalRequested = hostInputs.reduce(
      (sum, h) => sum + Math.pow(2, Math.ceil(Math.log2(parseInt(h) + 5))),
      0
    );
    if (totalRequested > totalHosts) {
      showError(
        "awsError",
        "Requested host counts exceed available IPs in the CIDR range."
      );
      return false;
    }
  }

  clearError("awsError");
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
    error.textContent = "All entries must be valid CIDRs (192.168.1.0/24).";
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
    error.textContent = "All entries must be valid CIDRs (192.168.0.0/24).";
    error.classList.remove("hidden");
  } else {
    input.classList.remove("error-border");
    error.classList.add("hidden");
  }
}

// Clear section functions
function clearCidrSection() {
  document.getElementById("ipOnlyInput").value = "";
  document.getElementById("subnetMaskInput").value = "24";
  updateSubnetMaskDisplay();
  document.getElementById("cidrResult").classList.add("hidden");
  validateIpOnlyInput();
}

function clearIpToCidrSection() {
  document.getElementById("firstIpInput").value = "";
  document.getElementById("lastIpInput").value = "";
  document.getElementById("ipToCidrResultWrapper").classList.add("hidden");
  validateIpToCidrInputs();
}

function clearAwsSection() {
  document.getElementById("awsCidrInput").value = "";
  document.getElementById("numSubnetsInput").value = "";
  document.getElementById("customSubnetInputs").innerHTML = `
    <div class="flex gap-3 items-center">
      <input type="number" class="subnet-hosts w-1/2 p-3 bg-white border border-gray-200 text-gray-900 rounded-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none transition-all duration-200 shadow-sm" placeholder="Hosts for Subnet 1 (e.g., 500)" min="1" oninput="validateAwsInputs()">
      <input type="text" class="subnet-name w-1/2 p-3 bg-white border border-gray-200 text-gray-900 rounded-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none transition-all duration-200 shadow-sm" placeholder="Name (optional)">
      <button class="text-red-500 font-bold w-10 h-10 flex items-center justify-center bg-white border border-red-200 hover:bg-red-50 hover:border-red-500 rounded-lg transition-colors shadow-sm text-lg" title="Remove" onclick="this.parentElement.remove(); updatePlaceholders(); validateAwsInputs();">&times;</button>
    </div>
    <button id="addSubnet" class="text-indigo-600 font-semibold text-sm flex flex-row items-center gap-1 hover:text-indigo-800 transition-colors w-fit mt-2">
      + Add Another Subnet
    </button>
  `;
  document.getElementById("awsSubnetsResult").innerHTML = "";
  document.getElementById("downloadSubnets").classList.add("hidden");
  document.querySelector('input[name="subnetMode"][value="equal"]').checked = true;
  toggleSubnetMode();
  validateAwsInputs();
  document.getElementById("addSubnet").addEventListener("click", () => {
    const subnetInputs = document.getElementById("customSubnetInputs");
    const subnetCount =
      subnetInputs.getElementsByClassName("subnet-hosts").length + 1;
    const inputContainer = document.createElement("div");
    inputContainer.className = "flex gap-3 items-center";
    const newInput = document.createElement("input");
    newInput.type = "number";
    newInput.className = "subnet-hosts w-1/2 p-3 bg-white border border-gray-200 text-gray-900 rounded-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none transition-all duration-200 shadow-sm";
    newInput.placeholder = `Hosts for Subnet ${subnetCount}`;
    newInput.min = "1";
    newInput.oninput = validateAwsInputs;
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "subnet-name w-1/2 p-3 bg-white border border-gray-200 text-gray-900 rounded-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none transition-all duration-200 shadow-sm";
    nameInput.placeholder = `Name (optional)`;
    const deleteButton = document.createElement("button");
    deleteButton.innerHTML = "&times;";
    deleteButton.title = "Remove";
    deleteButton.className =
      "text-red-500 font-bold w-10 h-10 flex items-center justify-center bg-white border border-red-200 hover:bg-red-50 hover:border-red-500 rounded-lg transition-colors shadow-sm text-lg";
    deleteButton.onclick = () => {
      inputContainer.remove();
      updatePlaceholders();
      validateAwsInputs();
    };
    inputContainer.appendChild(newInput);
    inputContainer.appendChild(nameInput);
    inputContainer.appendChild(deleteButton);
    subnetInputs.insertBefore(inputContainer,document.getElementById("addSubnet"));
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
  document.getElementById("routeResultWrapper").classList.add("hidden");
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
  document.getElementById("equalSubnetInput").classList.toggle("hidden", mode === "custom");
  document.getElementById("customSubnetInputs").classList.toggle("hidden", mode === "equal");
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

document.getElementById("ipOnlyInput").addEventListener("input", () => {
  clearError("cidrInputError");
});

async function calculateCidrToIp() {
  const ipPart = document.getElementById("ipOnlyInput").value.trim();
  const maskPart = document.getElementById("subnetMaskInput").value;

  if (!ipPart) {
    showError("cidrInputError", "Please enter an IP Address.");
    document.getElementById("cidrResult").classList.add("hidden");
    return;
  }

  if (!isValidIp(ipPart)) {
    showError("cidrInputError", "Invalid IP format (e.g., 192.168.1.0).");
    document.getElementById("cidrResult").classList.add("hidden");
    return;
  }

  const cidr = `${ipPart}/${maskPart}`;
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
      document.getElementById("cidrResultWrapper").classList.add("hidden");
      return;
    }

    const result = data.result;

    document.getElementById("cidrResultWrapper").classList.remove("hidden");
    const table = document.getElementById("cidrResult");
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = `
      <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-default">
        <td class="px-5 py-4 font-medium text-gray-900 dark:text-slate-100">${result.cidrRange}</td>
        <td class="px-5 py-4 text-gray-600 dark:text-slate-400">${result.netmask}</td>
        <td class="px-5 py-4 text-gray-600 dark:text-slate-400">${result.wildcardBits}</td>
        <td class="px-5 py-4 text-indigo-600 dark:text-indigo-400 font-semibold">${result.firstIp}</td>
        <td class="px-5 py-4 text-gray-500 dark:text-slate-500">${result.firstIpDecimal}</td>
        <td class="px-5 py-4 text-indigo-600 dark:text-indigo-400 font-semibold">${result.lastIp}</td>
        <td class="px-5 py-4 text-gray-500 dark:text-slate-500">${result.lastIpDecimal}</td>
        <td class="px-5 py-4 text-gray-900 dark:text-slate-100 font-medium">${result.totalHosts}</td>
      </tr>
    `;
  } catch (error) {
    showError("cidrInputError", "Failed to calculate. Please try again.");
    document.getElementById("cidrResultWrapper").classList.add("hidden");
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
    showError(
      "ipToCidrError",
      "First IP must be less than or equal to last IP."
    );
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
      document.getElementById("ipToCidrResultWrapper").classList.add("hidden");
      return;
    }

    const result = data.result;

    document.getElementById("ipToCidrResultWrapper").classList.remove("hidden");
    const table = document.getElementById("ipToCidrResult");
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = `
      <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-default">
        <td class="px-5 py-4 font-medium text-gray-900 dark:text-slate-100">${result.ipRange}</td>
        <td class="px-5 py-4"><span class="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold px-3 py-1 rounded-md border border-indigo-100 dark:border-indigo-800 shadow-sm">${result.cidrNotation}</span></td>
        <td class="px-5 py-4 text-gray-600 dark:text-slate-400">${result.netmask}</td>
        <td class="px-5 py-4 text-gray-900 dark:text-slate-100 font-medium">${result.totalHosts}</td>
      </tr>
    `;
  } catch (error) {
    showError("ipToCidrError", "Failed to calculate. Please try again.");
    document.getElementById("ipToCidrResultWrapper").classList.add("hidden");
  }
}

document.getElementById("addSubnet").addEventListener("click", () => {
  const subnetInputs = document.getElementById("customSubnetInputs");
  const subnetCount = subnetInputs.getElementsByClassName("subnet-hosts").length + 1;

  const inputContainer = document.createElement("div");
  inputContainer.className = "flex gap-3 items-center";

  const newInput = document.createElement("input");
  newInput.type = "number";
  newInput.className = "subnet-hosts w-1/2 p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition-all duration-200 shadow-sm";
  newInput.placeholder = `Hosts for Subnet ${subnetCount}`;
  newInput.min = "1";
  newInput.oninput = validateAwsInputs;

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "subnet-name w-1/2 p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition-all duration-200 shadow-sm";
  nameInput.placeholder = `Name (optional)`;

  const deleteButton = document.createElement("button");
  deleteButton.innerHTML = "&times;";
  deleteButton.title = "Remove";
  deleteButton.className =
    "text-red-500 dark:text-red-400 font-bold w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-500 dark:hover:border-red-400 rounded-lg transition-colors shadow-sm text-lg";
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

    const names = Array.from(
      document.getElementsByClassName("subnet-name")
    ).map(
      (input) =>
        input.value.trim() ||
        `Subnet ${
          Array.from(document.getElementsByClassName("subnet-name")).indexOf(
            input
          ) + 1
        }`
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

  currentSubnets = data.subnets;
  const subnets = data.subnets;
  subnets.forEach((subnet, index) => {
    resultDiv.innerHTML += `
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div class="bg-gradient-to-r from-gray-50 to-white dark:from-slate-900/50 dark:to-slate-800 px-5 py-3 border-b border-gray-200 dark:border-slate-700">
          <h3 class="text-lg font-bold text-indigo-900 dark:text-indigo-300">${subnet.name || `Subnet ${index + 1}`}</h3>
        </div>
        <table class="w-full text-sm">
          <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"><td class="px-5 py-2.5 font-medium text-gray-600 dark:text-slate-400 w-1/2">CIDR Range</td><td class="px-5 py-2.5 text-gray-900 dark:text-slate-100 font-semibold">${subnet.cidrRange}</td></tr>
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"><td class="px-5 py-2.5 font-medium text-gray-600 dark:text-slate-400">Netmask</td><td class="px-5 py-2.5 text-gray-800 dark:text-slate-200">${subnet.netmask}</td></tr>
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"><td class="px-5 py-2.5 font-medium text-gray-600 dark:text-slate-400">Wildcard Bits</td><td class="px-5 py-2.5 text-gray-800 dark:text-slate-200">${subnet.wildcardBits}</td></tr>
            <tr class="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 transition-colors bg-indigo-50/30 dark:bg-indigo-900/20"><td class="px-5 py-2.5 font-medium text-indigo-800 dark:text-indigo-300">First IP</td><td class="px-5 py-2.5 text-indigo-900 dark:text-indigo-100 font-bold">${subnet.firstIp}</td></tr>
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"><td class="px-5 py-2.5 font-medium text-gray-600 dark:text-slate-400">First IP (Dec)</td><td class="px-5 py-2.5 text-gray-500 dark:text-slate-500">${subnet.firstIpDecimal}</td></tr>
            <tr class="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 transition-colors bg-indigo-50/30 dark:bg-indigo-900/20"><td class="px-5 py-2.5 font-medium text-indigo-800 dark:text-indigo-300">Last IP</td><td class="px-5 py-2.5 text-indigo-900 dark:text-indigo-100 font-bold">${subnet.lastIp}</td></tr>
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"><td class="px-5 py-2.5 font-medium text-gray-600 dark:text-slate-400">Last IP (Dec)</td><td class="px-5 py-2.5 text-gray-500 dark:text-slate-500">${subnet.lastIpDecimal}</td></tr>
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"><td class="px-5 py-2.5 font-medium text-gray-600 dark:text-slate-400">Total Hosts</td><td class="px-5 py-2.5 text-gray-900 dark:text-slate-100 font-semibold">${subnet.totalHosts}</td></tr>
            <tr class="hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"><td class="px-5 py-2.5 font-bold text-emerald-700 dark:text-emerald-400">Usable Hosts</td><td class="px-5 py-2.5 text-emerald-800 dark:text-emerald-300 font-bold">${subnet.usableHosts}</td></tr>
            <tr class="hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"><td class="px-5 py-2.5 font-semibold text-red-600 dark:text-red-400">Reserved IPs</td><td class="px-5 py-2.5 text-red-600 dark:text-red-400">${subnet.reservedIps}</td></tr>
          </tbody>
        </table>
      </div>
    `;
  });
  document.getElementById("downloadSubnets").classList.remove("hidden");
}

function downloadSubnets() {
  if (!currentSubnets) {
    showError("awsError", "No subnets available to download.");
    return;
  }

  const cidr = document.getElementById("awsCidrInput").value.trim() || "subnets";
  const jsonString = JSON.stringify(currentSubnets, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${cidr.replace("/", "-")}_subnets.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
  const cidrs = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

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
      document.getElementById("routeResultWrapper").classList.add("hidden");
      return;
    }

    const table = document.getElementById("routeTable");
    document.getElementById("routeResultWrapper").classList.remove("hidden");
    document.getElementById("routeInputError").textContent = "";
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = `
      <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-default">
        <td class="px-5 py-4 text-sm text-gray-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">${data.originalCidrs.join("\n")}</td>
        <td class="px-5 py-4"><span class="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold px-3 py-1 rounded-md border border-indigo-100 dark:border-indigo-800 shadow-sm">${data.summarizedCidr}</span></td>
        <td class="px-5 py-4 text-gray-600 dark:text-slate-400">${data.netmask}</td>
        <td class="px-5 py-4 text-gray-900 dark:text-slate-100 font-medium">${data.totalHosts}</td>
      </tr>
    `;
  } catch (error) {
    showError("routeInputError", "Failed to summarize. Please try again.");
    document.getElementById("routeResultWrapper").classList.add("hidden");
  }
}

// Sidebar Navigation Logic
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.calc-section').forEach((section) => {
    section.classList.add('hidden');
  });
  
  // Show target section
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.remove('hidden');
  }
  
  // Update nav active state
  document.querySelectorAll('aside nav button').forEach((btn) => {
    btn.classList.remove('bg-blue-50', 'text-blue-700');
    btn.classList.add('text-gray-600', 'dark:text-slate-400', 'hover:bg-gray-100', 'dark:hover:bg-slate-700', 'hover:text-gray-900', 'dark:hover:text-slate-100');
  });
  
  const activeBtn = document.getElementById('nav-' + sectionId);
  if (activeBtn) {
    activeBtn.classList.remove('text-gray-600', 'dark:text-slate-400', 'hover:bg-gray-100', 'dark:hover:bg-slate-700', 'hover:text-gray-900', 'dark:hover:text-slate-100');
    activeBtn.classList.add('bg-blue-50', 'dark:bg-blue-900/40', 'text-blue-700', 'dark:text-blue-300');
  }
}

// Dark Mode Toggle Logic
const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
const themeToggleBtn = document.getElementById('theme-toggle');

function initTheme() {
    // Change the icons inside the button based on previous settings
    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        if (themeToggleLightIcon) themeToggleLightIcon.classList.remove('hidden');
        document.documentElement.classList.add('dark');
    } else {
        if (themeToggleDarkIcon) themeToggleDarkIcon.classList.remove('hidden');
        document.documentElement.classList.remove('dark');
    }
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function() {
        // toggle icons inside button
        if (themeToggleDarkIcon) themeToggleDarkIcon.classList.toggle('hidden');
        if (themeToggleLightIcon) themeToggleLightIcon.classList.toggle('hidden');

        // if set via local storage previously
        if (localStorage.getItem('color-theme')) {
            if (localStorage.getItem('color-theme') === 'light') {
                document.documentElement.classList.add('dark');
                localStorage.setItem('color-theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('color-theme', 'light');
            }

        // if NOT set via local storage previously
        } else {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('color-theme', 'light');
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('color-theme', 'dark');
            }
        }
    });
}

// Ensure the first section is active on load and theme is initialized
document.addEventListener('DOMContentLoaded', () => {
  showSection('section-cidr');
  initTheme();
});
