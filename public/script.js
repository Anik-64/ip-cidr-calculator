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
  const cidr = document.getElementById("awsCidrInput");
  const numSubnets = document.getElementById("numSubnetsInput");
  const error = document.getElementById("awsError");
  let message = "";

  if (!cidr.value.trim()) {
    message = "Please enter a CIDR.";
  } else if (!isValidCidr(cidr.value.trim())) {
    message = "Invalid CIDR format (10.0.0.0/16).";
  } else if (!numSubnets.value || numSubnets.value <= 0) {
    message = "Enter a positive number of subnets.";
  }

  if (message) {
    cidr.classList.add("error-border");
    numSubnets.classList.add("error-border");
    error.textContent = message;
    error.classList.remove("hidden");
  } else {
    cidr.classList.remove("error-border");
    numSubnets.classList.remove("error-border");
    error.classList.add("hidden");
  }
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
  document.getElementById("awsSubnetsResult").innerHTML = "";
  validateAwsInputs();
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

async function calculateAwsSubnets() {
  const cidr = document.getElementById("awsCidrInput").value.trim();
  const numSubnets = document.getElementById("numSubnetsInput").value.trim();

  if (!cidr) {
    showError("awsError", "Please enter a CIDR range.");
    return;
  }

  if (!isValidCidr(cidr)) {
    showError("awsError", "Invalid CIDR format (10.0.0.0/16).");
    return;
  }

  if (!numSubnets || isNaN(numSubnets) || numSubnets <= 0) {
    showError("awsError", "Please enter a valid number of subnets (4).");
    return;
  }

  const [baseAddr, baseBits] = cidr.split("/");
  const totalHosts = Math.pow(2, 32 - parseInt(baseBits, 10));
  const numSubnetsNum = parseInt(numSubnets, 10);

  if (totalHosts / numSubnetsNum < 8) {
    showError("awsError", "Too many subnets for the given CIDR range.");
    return;
  }

  clearError("awsError");

  try {
    const response = await fetch("/api/v1/aws-subnets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cidr, numSubnets }),
    });

    const data = await response.json();

    if (data.error) {
      showError("awsError", data.message);
      document.getElementById("awsSubnetsResult").classList.add("hidden");
      return;
    }

    const subnets = data.subnets;

    const resultDiv = document.getElementById("awsSubnetsResult");
    resultDiv.innerHTML = "";
    subnets.forEach((subnet, index) => {
      resultDiv.innerHTML += `
        <div class="bg-gray-50 p-4 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2">Subnet ${index + 1}</h3>
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
  } catch (error) {
    showError("awsError", "Failed to generate subnets. Please try again.");
    document.getElementById("awsSubnetsResult").classList.add("hidden");
  }
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
