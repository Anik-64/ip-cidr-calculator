// Helper function to validate IP address
function isValidIp(ip) {
  const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

// Helper function to validate CIDR
function isValidCidr(cidr) {
  const cidrRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/([0-2]?[0-9]|3[0-2])$/;
  return cidrRegex.test(cidr);
}

function ipToDecimal(ip) {
  return ip.split('.').reduce((acc, octet, index) => acc + parseInt(octet) * Math.pow(256, 3 - index), 0);
}

// Helper function to show error message
function showError(elementId, message) {
  const input = document.getElementById(elementId);
  let errorDiv = input.nextElementSibling;
  if (!errorDiv || !errorDiv.classList.contains('error-message')) {
    errorDiv = document.createElement('div');
    errorDiv.classList.add('error-message', 'text-red-500', 'text-sm', 'mt-1');
    input.parentNode.insertBefore(errorDiv, input.nextSibling);
  }
  errorDiv.textContent = message;
}

// Helper function to clear error message
function clearError(elementId) {
  const input = document.getElementById(elementId);
  const errorDiv = input.nextElementSibling;
  if (errorDiv && errorDiv.classList.contains('error-message')) {
    errorDiv.textContent = '';
  }
}

async function calculateCidrToIp() {
  const cidr = document.getElementById('cidrInput').value.trim();

  // Validation
  if (!cidr) {
    showError('cidrInput', 'Please enter a CIDR range.');
    return;
  }
  if (!isValidCidr(cidr)) {
    showError('cidrInput', 'Invalid CIDR format (e.g., 192.168.1.0/24).');
    return;
  }
  clearError('cidrInput');

  try {
    const response = await fetch('/cidr-to-ip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cidr })
    });
    if (!response.ok) throw new Error('Server error');
    const data = await response.json();

    const table = document.getElementById('cidrResult');
    table.classList.remove('hidden');
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = `
      <tr>
        <td class="p-2">${data.cidrRange}</td>
        <td class="p-2">${data.netmask}</td>
        <td class="p-2">${data.wildcardBits}</td>
        <td class="p-2">${data.firstIp}</td>
        <td class="p-2">${data.firstIpDecimal}</td>
        <td class="p-2">${data.lastIp}</td>
        <td class="p-2">${data.lastIpDecimal}</td>
        <td class="p-2">${data.totalHosts}</td>
      </tr>
    `;
  } catch (error) {
    showError('cidrInput', 'Failed to calculate. Please try again.');
  }
}

async function calculateIpToCidr() {
  const firstIp = document.getElementById('firstIpInput').value.trim();
  const lastIp = document.getElementById('lastIpInput').value.trim();

  // Validation
  if (!firstIp || !lastIp) {
    if (!firstIp) showError('firstIpInput', 'Please enter the first IP.');
    if (!lastIp) showError('lastIpInput', 'Please enter the last IP.');
    return;
  }

  if (!isValidIp(firstIp)) {
    showError('firstIpInput', 'Invalid IP format (e.g., 192.168.1.0).');
    return;
  }

  if (!isValidIp(lastIp)) {
    showError('lastIpInput', 'Invalid IP format (e.g., 192.168.1.255).');
    return;
  }

  // Convert IPs to decimal for comparison
  const firstIpDecimal = ipToDecimal(firstIp);
  const lastIpDecimal = ipToDecimal(lastIp);

  if (firstIpDecimal > lastIpDecimal) {
    showError('firstIpInput', 'First IP must be less than or equal to last IP.');
    return;
  }

  clearError('firstIpInput');
  clearError('lastIpInput');

  try {
    const response = await fetch('/ip-to-cidr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstIp, lastIp })
    });
    if (!response.ok) throw new Error('Server error');
    const data = await response.json();

    const table = document.getElementById('ipToCidrResult');
    table.classList.remove('hidden');
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = `
      <tr>
        <td class="p-2">${data.ipRange}</td>
        <td class="p-2">${data.cidrNotation}</td>
        <td class="p-2">${data.netmask}</td>
        <td class="p-2">${data.totalHosts}</td>
      </tr>
    `;
  } catch (error) {
    showError('firstIpInput', 'Failed to calculate. Please try again.');
  }
}

async function calculateAwsSubnets() {
  const cidr = document.getElementById('awsCidrInput').value.trim();
  const numSubnets = document.getElementById('numSubnetsInput').value.trim();

  // Validation
  if (!cidr) {
    showError('awsCidrInput', 'Please enter a CIDR range.');
    return;
  }
  if (!isValidCidr(cidr)) {
    showError('awsCidrInput', 'Invalid CIDR format (e.g., 10.0.0.0/16).');
    return;
  }
  if (!numSubnets || isNaN(numSubnets) || numSubnets <= 0) {
    showError('numSubnetsInput', 'Please enter a valid number of subnets (e.g., 4).');
    return;
  }

  // Check if the CIDR range can accommodate the requested number of subnets
  const [baseAddr, baseBits] = cidr.split('/');
  const totalHosts = Math.pow(2, 32 - parseInt(baseBits, 10));
  const numSubnetsNum = parseInt(numSubnets, 10);

  if (totalHosts / numSubnetsNum < 8) {
    showError('awsCidrInput', 'Too many subnets for the given CIDR range.');
    return;
  }

  clearError('awsCidrInput');
  clearError('numSubnetsInput');

  try {
    const response = await fetch('/aws-subnets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cidr, numSubnets })
    });
    if (!response.ok) throw new Error('Server error');
    const subnets = await response.json();

    const resultDiv = document.getElementById('awsSubnetsResult');
    resultDiv.innerHTML = '';
    subnets.forEach((subnet, index) => {
      resultDiv.innerHTML += `
        <div class="bg-gray-50 p-4 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2">Subnet ${index + 1}</h3>
          <table class="w-full">
            <tr><td class="p-2 font-bold">CIDR Range</td><td class="p-2">${subnet.cidrRange}</td></tr>
            <tr><td class="p-2 font-bold">Netmask</td><td class="p-2">${subnet.netmask}</td></tr>
            <tr><td class="p-2 font-bold">Wildcard Bits</td><td class="p-2">${subnet.wildcardBits}</td></tr>
            <tr><td class="p-2 font-bold">First IP</td><td class="p-2">${subnet.firstIp}</td></tr>
            <tr><td class="p-2 font-bold">First IP (Dec)</td><td class="p-2">${subnet.firstIpDecimal}</td></tr>
            <tr><td class="p-2 font-bold">Last IP</td><td class="p-2">${subnet.lastIp}</td></tr>
            <tr><td class="p-2 font-bold">Last IP (Dec)</td><td class="p-2">${subnet.lastIpDecimal}</td></tr>
            <tr><td class="p-2 font-bold">Total Hosts</td><td class="p-2">${subnet.totalHosts}</td></tr>
            <tr><td class="p-2 font-bold text-green-600">Usable Hosts</td><td class="p-2">${subnet.usableHosts}</td></tr>
            <tr><td class="p-2 font-bold text-red-600">Reserved IPs</td><td class="p-2">${subnet.reservedIps}</td></tr>
          </table>
        </div>
      `;
    });
  } catch (error) {
    showError('awsCidrInput', 'Failed to generate subnets. Please try again.');
  }
}

async function checkOverlap() {
  const input = document.getElementById("overlapInput").value.trim();
  const cidrs = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (cidrs.length < 2) {
    showError("overlapInput", "Enter at least two CIDRs.");
    return;
  }
  if (!cidrs.every(isValidCidr)) {
    showError("overlapInput", "All entries must be valid CIDRs.");
    return;
  }
  clearError("overlapInput");

  try {
    const response = await fetch("/check-overlap", {
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
    showError("overlapInput", "Failed to check overlaps. Please try again.");
  }
}

async function summarizeRoutes() {
  const input = document.getElementById("routeInput").value.trim();
  const cidrs = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (cidrs.length < 2) {
    showError("routeInput", "Enter at least two CIDRs.");
    return;
  }

  if (!cidrs.every(isValidCidr)) {
    showError(
      "routeInput",
      "All entries must be valid CIDRs (e.g., 192.168.0.0/24)."
    );
    return;
  }

  clearError("routeInput");

  try {
    const response = await fetch("/summarize-routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cidrs }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Server error");

    const table = document.getElementById("routeTable");
    table.classList.remove("hidden");
    document.getElementById("routeError").textContent = "";
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
    document.getElementById("routeTable").classList.add("hidden");
    document.getElementById("routeError").textContent = error.message;
  }
}

async function planVlanSubnets() {
  const baseCidr = document.getElementById("vlanBaseCidr").value.trim();
  const input = document.getElementById("vlanInput").value.trim();
  const vlanLines = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const vlans = vlanLines.map((line) => {
    const [name, hosts] = line.split(":");
    return { name: name?.trim(), hosts: parseInt(hosts?.trim(), 10) };
  });

  if (!baseCidr) {
    showError("vlanBaseCidr", "Please enter a base CIDR.");
    return;
  }
  if (!isValidCidr(baseCidr)) {
    showError("vlanBaseCidr", "Invalid CIDR format (e.g., 10.0.0.0/16).");
    return;
  }
  if (vlanLines.length === 0) {
    showError("vlanInput", "Enter at least one VLAN.");
    return;
  }
  if (!vlans.every((v) => v.name && !isNaN(v.hosts) && v.hosts > 0)) {
    showError(
      "vlanInput",
      'Each VLAN must be in "name:hosts" format with a positive host count (e.g., VLAN10:50).'
    );
    return;
  }
  clearError("vlanBaseCidr");
  clearError("vlanInput");

  try {
    const response = await fetch("/vlan-subnets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseCidr, vlans }),
    });
    if (!response.ok)
      throw new Error((await response.json()).error || "Server error");
    const subnets = await response.json();

    const resultDiv = document.getElementById("vlanResult");
    resultDiv.innerHTML = "";
    subnets.forEach((subnet) => {
      resultDiv.innerHTML += `
        <div class="bg-gray-50 p-4 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2">${subnet.vlanName}</h3>
          <table class="w-full">
            <tr><td class="p-2 font-bold">CIDR Range</td><td class="p-2">${subnet.cidrRange}</td></tr>
            <tr><td class="p-2 font-bold">Netmask</td><td class="p-2">${subnet.netmask}</td></tr>
            <tr><td class="p-2 font-bold">First IP</td><td class="p-2">${subnet.firstIp}</td></tr>
            <tr><td class="p-2 font-bold">Last IP</td><td class="p-2">${subnet.lastIp}</td></tr>
            <tr><td class="p-2 font-bold">Total Hosts</td><td class="p-2">${subnet.totalHosts}</td></tr>
            <tr><td class="p-2 font-bold text-green-600">Usable Hosts</td><td class="p-2">${subnet.usableHosts}</td></tr>
          </table>
        </div>
      `;
    });
  } catch (error) {
    showError("vlanBaseCidr", error.message);
  }
}